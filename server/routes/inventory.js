const express = require('express');
const db = require('../database');
const { sendNotification } = require('../services/telegramService');
const router = express.Router();

// Middleware (Simple version, should be shared)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    const jwt = require('jsonwebtoken');
    const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkey';
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

router.use(authenticateToken);

// GET all products
router.get('/', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ADD product
router.post('/', (req, res) => {
    const { name, sku, price, stock_quantity, description } = req.body;
    db.run("INSERT INTO products (name, sku, price, stock_quantity, description) VALUES (?, ?, ?, ?, ?)",
        [name, sku, price, stock_quantity || 0, description],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Log initial stock
            if (stock_quantity > 0) {
                db.run("INSERT INTO inventory_logs (product_id, change_amount, type, reason) VALUES (?, ?, ?, ?)",
                    [this.lastID, stock_quantity, 'in', 'Initial Stock']);
            }

            // Send product added notification
            sendNotification('PRODUCT_ADDED', {
                name,
                sku,
                price,
                stock: stock_quantity || 0,
                addedBy: req.user.name
            });

            res.status(201).json({ id: this.lastID, message: 'Product added' });
        }
    );
});

// UPDATE Stock (Inventory Adjustment)
router.post('/:id/stock', (req, res) => {
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
            }
        );
    });
});

module.exports = router;
