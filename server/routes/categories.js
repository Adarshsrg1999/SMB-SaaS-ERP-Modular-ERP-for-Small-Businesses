const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');

// Apply authentication to all routes
router.use(authenticateToken);

// GET all categories (with hierarchy)
router.get('/', checkPermission('inventory', 'read'), (req, res) => {
    const query = `
        SELECT c.*, 
               p.name as parent_name,
               (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        ORDER BY c.name
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET single category
router.get('/:id', checkPermission('inventory', 'read'), (req, res) => {
    const query = `
        SELECT c.*, 
               p.name as parent_name,
               (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        WHERE c.id = ?
    `;

    db.get(query, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Category not found' });
        res.json(row);
    });
});

// CREATE category
router.post('/', checkPermission('inventory', 'write'), (req, res) => {
    const { name, description, parent_id } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
    }

    db.run(
        "INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)",
        [name, description, parent_id || null],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Category name already exists' });
                }
                return res.status(500).json({ error: err.message });
            }

            // Audit log
            auditService.log(
                req.user.id,
                'CREATE',
                'category',
                this.lastID,
                { name, description, parent_id },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.status(201).json({
                id: this.lastID,
                message: 'Category created successfully'
            });
        }
    );
});

// UPDATE category
router.put('/:id', checkPermission('inventory', 'write'), (req, res) => {
    const { name, description, parent_id } = req.body;
    const categoryId = req.params.id;

    // Prevent circular parent reference
    if (parent_id && parseInt(parent_id) === parseInt(categoryId)) {
        return res.status(400).json({ error: 'Category cannot be its own parent' });
    }

    db.run(
        "UPDATE categories SET name = ?, description = ?, parent_id = ? WHERE id = ?",
        [name, description, parent_id || null, categoryId],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Category name already exists' });
                }
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Category not found' });
            }

            // Audit log
            auditService.log(
                req.user.id,
                'UPDATE',
                'category',
                categoryId,
                { name, description, parent_id },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.json({ message: 'Category updated successfully' });
        }
    );
});

// DELETE category
router.delete('/:id', checkPermission('inventory', 'delete'), (req, res) => {
    const categoryId = req.params.id;

    // Check if category has products
    db.get(
        "SELECT COUNT(*) as count FROM products WHERE category_id = ?",
        [categoryId],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });

            if (row.count > 0) {
                return res.status(400).json({
                    error: `Cannot delete category with ${row.count} assigned products. Please reassign or delete products first.`
                });
            }

            // Check if category has child categories
            db.get(
                "SELECT COUNT(*) as count FROM categories WHERE parent_id = ?",
                [categoryId],
                (err, row) => {
                    if (err) return res.status(500).json({ error: err.message });

                    if (row.count > 0) {
                        return res.status(400).json({
                            error: `Cannot delete category with ${row.count} subcategories. Please delete subcategories first.`
                        });
                    }

                    // Safe to delete
                    db.run("DELETE FROM categories WHERE id = ?", [categoryId], function (err) {
                        if (err) return res.status(500).json({ error: err.message });

                        if (this.changes === 0) {
                            return res.status(404).json({ error: 'Category not found' });
                        }

                        // Audit log
                        auditService.log(
                            req.user.id,
                            'DELETE',
                            'category',
                            categoryId,
                            {},
                            req.headers['x-forwarded-for'] || req.socket.remoteAddress
                        );

                        res.json({ message: 'Category deleted successfully' });
                    });
                }
            );
        }
    );
});

module.exports = router;
