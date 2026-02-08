const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');

router.use(authenticateToken);

// GET all warehouses
router.get('/', checkPermission('inventory', 'read'), (req, res) => {
    const query = `
        SELECT w.*, u.name as manager_name
        FROM warehouses w
        LEFT JOIN users u ON w.manager_id = u.id
        WHERE w.is_active = 1
        ORDER BY w.name
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET warehouse stock
router.get('/:id/stock', checkPermission('inventory', 'read'), (req, res) => {
    const query = `
        SELECT ws.*, p.name as product_name, p.sku
        FROM warehouse_stock ws
        JOIN products p ON ws.product_id = p.id
        WHERE ws.warehouse_id = ?
        ORDER BY p.name
    `;

    db.all(query, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREATE warehouse
router.post('/', checkPermission('inventory', 'write'), (req, res) => {
    const { name, location, manager_id } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Warehouse name is required' });
    }

    db.run(
        "INSERT INTO warehouses (name, location, manager_id) VALUES (?, ?, ?)",
        [name, location, manager_id],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Warehouse name already exists' });
                }
                return res.status(500).json({ error: err.message });
            }

            auditService.log(
                req.user.id,
                'CREATE',
                'warehouse',
                this.lastID,
                { name, location },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.status(201).json({ id: this.lastID, message: 'Warehouse created successfully' });
        }
    );
});

module.exports = router;
