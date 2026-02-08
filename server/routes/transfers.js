const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');

router.use(authenticateToken);

// GET all transfers
router.get('/', checkPermission('inventory', 'read'), (req, res) => {
    const query = `
        SELECT st.*, 
               wf.name as from_warehouse_name,
               wt.name as to_warehouse_name,
               p.name as product_name,
               u.name as initiated_by_name
        FROM stock_transfers st
        JOIN warehouses wf ON st.from_warehouse_id = wf.id
        JOIN warehouses wt ON st.to_warehouse_id = wt.id
        JOIN products p ON st.product_id = p.id
        LEFT JOIN users u ON st.initiated_by = u.id
        ORDER BY st.created_at DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREATE transfer
router.post('/', checkPermission('inventory', 'write'), (req, res) => {
    const { from_warehouse_id, to_warehouse_id, product_id, quantity, notes } = req.body;

    if (!from_warehouse_id || !to_warehouse_id || !product_id || !quantity) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (from_warehouse_id === to_warehouse_id) {
        return res.status(400).json({ error: 'Cannot transfer to the same warehouse' });
    }

    // Check stock availability
    db.get(
        "SELECT quantity FROM warehouse_stock WHERE warehouse_id = ? AND product_id = ?",
        [from_warehouse_id, product_id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });

            if (!row || row.quantity < quantity) {
                return res.status(400).json({ error: 'Insufficient stock in source warehouse' });
            }

            // Create transfer
            db.run(
                "INSERT INTO stock_transfers (from_warehouse_id, to_warehouse_id, product_id, quantity, initiated_by, notes) VALUES (?, ?, ?, ?, ?, ?)",
                [from_warehouse_id, to_warehouse_id, product_id, quantity, req.user.id, notes],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });

                    auditService.log(
                        req.user.id,
                        'CREATE',
                        'stock_transfer',
                        this.lastID,
                        { from_warehouse_id, to_warehouse_id, product_id, quantity },
                        req.headers['x-forwarded-for'] || req.socket.remoteAddress
                    );

                    res.status(201).json({ id: this.lastID, message: 'Transfer initiated' });
                }
            );
        }
    );
});

// COMPLETE transfer
router.patch('/:id/complete', checkPermission('inventory', 'write'), (req, res) => {
    // Get transfer details
    db.get("SELECT * FROM stock_transfers WHERE id = ?", [req.params.id], (err, transfer) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

        if (transfer.status !== 'pending') {
            return res.status(400).json({ error: 'Transfer already completed or cancelled' });
        }

        // Deduct from source warehouse
        db.run(
            "UPDATE warehouse_stock SET quantity = quantity - ? WHERE warehouse_id = ? AND product_id = ?",
            [transfer.quantity, transfer.from_warehouse_id, transfer.product_id]
        );

        // Add to destination warehouse (or create if doesn't exist)
        db.run(
            "INSERT INTO warehouse_stock (warehouse_id, product_id, quantity) VALUES (?, ?, ?) ON CONFLICT(warehouse_id, product_id) DO UPDATE SET quantity = quantity + ?",
            [transfer.to_warehouse_id, transfer.product_id, transfer.quantity, transfer.quantity]
        );

        // Update transfer status
        db.run(
            "UPDATE stock_transfers SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
            [req.params.id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                auditService.log(
                    req.user.id,
                    'UPDATE',
                    'stock_transfer_complete',
                    req.params.id,
                    { from_warehouse_id: transfer.from_warehouse_id, to_warehouse_id: transfer.to_warehouse_id },
                    req.headers['x-forwarded-for'] || req.socket.remoteAddress
                );

                res.json({ message: 'Transfer completed successfully' });
            }
        );
    });
});

module.exports = router;
