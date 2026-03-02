const express = require('express');
const db = require('../database');
const { sendNotification } = require('../services/telegramService');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');
const router = express.Router();

router.use(authenticateToken);

// GET all products (with category and tag filtering)
router.get('/', checkPermission('inventory', 'read'), (req, res) => {
    const { category, tags } = req.query;
    let query = `
        SELECT p.*, c.name as category_name,
               GROUP_CONCAT(t.name) as tag_names,
               GROUP_CONCAT(t.id) as tag_ids
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_tags pt ON p.id = pt.product_id
        LEFT JOIN tags t ON pt.tag_id = t.id
    `;
    const params = [];
    const conditions = [];

    if (category) {
        conditions.push('p.category_id = ?');
        params.push(category);
    }

    if (tags) {
        const tagList = tags.split(',');
        conditions.push(`t.id IN (${tagList.map(() => '?').join(',')})`);
        params.push(...tagList);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY p.id ORDER BY p.name';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Parse tag data
        const products = rows.map(row => ({
            ...row,
            tags: row.tag_names ? row.tag_names.split(',').map((name, i) => ({
                id: row.tag_ids.split(',')[i],
                name
            })) : []
        }));

        res.json(products);
    });
});

// ADD product
router.post('/', checkPermission('inventory', 'write'), (req, res) => {
    const { name, sku, price, stock_quantity, description, category_id, tag_ids } = req.body;

    db.run(
        "INSERT INTO products (name, sku, price, stock_quantity, description, category_id) VALUES (?, ?, ?, ?, ?, ?)",
        [name, sku, price, stock_quantity || 0, description, category_id || null],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            const productId = this.lastID;

            // Add tags if provided
            if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
                const stmt = db.prepare("INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)");
                tag_ids.forEach(tagId => stmt.run(productId, tagId));
                stmt.finalize();
            }

            // Log initial stock
            if (stock_quantity > 0) {
                db.run("INSERT INTO inventory_logs (product_id, change_amount, type, reason) VALUES (?, ?, ?, ?)",
                    [productId, stock_quantity, 'in', 'Initial Stock']);
            }

            // Send product added notification
            sendNotification('PRODUCT_ADDED', {
                name,
                sku,
                price,
                stock: stock_quantity || 0,
                addedBy: req.user.name
            });

            // Log activity
            auditService.log(
                req.user.id,
                'CREATE',
                'product',
                productId,
                { name, sku, price, initial_stock: stock_quantity || 0, category_id, tag_ids },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.status(201).json({ id: productId, message: 'Product added' });
        }
    );
});

// UPDATE Stock (Inventory Adjustment)
router.post('/:id/stock', checkPermission('inventory', 'write'), (req, res) => {
    const { change_amount, type, reason } = req.body; // type: 'in' or 'out'
    const productId = req.params.id;
    const threshold = parseInt(process.env.LARGE_STOCK_ADJUSTMENT_THRESHOLD) || 50;

    const adjustment = type === 'in' ? change_amount : -change_amount;

    // Get product details first
    db.get("SELECT name, sku, stock_quantity, min_stock_level FROM products WHERE id = ?", [productId], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const newStock = product.stock_quantity + adjustment;

        db.run("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
            [adjustment, productId],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                db.run("INSERT INTO inventory_logs (product_id, change_amount, type, reason) VALUES (?, ?, ?, ?)",
                    [productId, change_amount, type, reason]);

                // Check for large stock adjustment
                if (change_amount >= threshold) {
                    sendNotification('LARGE_STOCK_ADJUSTMENT', {
                        productName: product.name,
                        amount: change_amount,
                        type,
                        reason,
                        adjustedBy: req.user.name
                    });
                }

                // Check for out of stock
                if (newStock === 0) {
                    sendNotification('OUT_OF_STOCK', {
                        productName: product.name,
                        sku: product.sku
                    });
                }
                // Check for low stock
                else if (newStock > 0 && newStock <= product.min_stock_level) {
                    sendNotification('LOW_STOCK', {
                        productName: product.name,
                        sku: product.sku,
                        currentStock: newStock,
                        minLevel: product.min_stock_level
                    });
                }

                res.json({ message: 'Stock updated' });

                // Log activity
                auditService.log(
                    req.user.id,
                    'UPDATE',
                    'inventory',
                    productId,
                    { change: adjustment, type, reason, new_stock: newStock },
                    req.headers['x-forwarded-for'] || req.socket.remoteAddress
                );
            }
        );
    });
});

// UPDATE product details
router.put('/:id', checkPermission('inventory', 'write'), (req, res) => {
    const productId = req.params.id;
    const { name, sku, price, description, category_id, tag_ids } = req.body;

    db.run(
        "UPDATE products SET name = ?, sku = ?, price = ?, description = ?, category_id = ? WHERE id = ?",
        [name, sku, price, description, category_id || null, productId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });

            // Update tags: Clear and re-add
            db.run("DELETE FROM product_tags WHERE product_id = ?", [productId], (err) => {
                if (err) console.error('Error clearing old tags:', err.message);

                if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
                    const stmt = db.prepare("INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)");
                    tag_ids.forEach(tagId => stmt.run(productId, tagId));
                    stmt.finalize();
                }

                // Log activity
                auditService.log(
                    req.user.id,
                    'UPDATE',
                    'product',
                    productId,
                    { name, sku, price, category_id, tag_ids },
                    req.headers['x-forwarded-for'] || req.socket.remoteAddress
                );

                res.json({ message: 'Product updated' });
            });
        }
    );
});

// DELETE product
router.delete('/:id', checkPermission('inventory', 'delete'), (req, res) => {
    const productId = req.params.id;

    // Get info for audit
    db.get("SELECT name, sku FROM products WHERE id = ?", [productId], (err, product) => {
        if (err || !product) return res.status(404).json({ error: 'Product not found' });

        db.run("DELETE FROM products WHERE id = ?", [productId], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            auditService.log(
                req.user.id,
                'DELETE',
                'product',
                productId,
                { name: product.name, sku: product.sku },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.json({ message: 'Product deleted' });
        });
    });
});

module.exports = router;
