const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');

router.use(authenticateToken);

// GET all purchase orders
router.get('/', checkPermission('inventory', 'read'), (req, res) => {
    const query = `
        SELECT po.*, v.name as vendor_name
        FROM purchase_orders po
        LEFT JOIN vendors v ON po.vendor_id = v.id
        ORDER BY po.created_at DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREATE purchase order
router.post('/', checkPermission('inventory', 'write'), (req, res) => {
    const { vendor_id, order_number, items, expected_delivery, notes } = req.body;

    if (!vendor_id || !items || items.length === 0) {
        return res.status(400).json({ error: 'Vendor and items are required' });
    }

    const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    db.run(
        "INSERT INTO purchase_orders (vendor_id, order_number, total, expected_delivery, notes) VALUES (?, ?, ?, ?, ?)",
        [vendor_id, order_number, total, expected_delivery, notes],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            const poId = this.lastID;

            // Insert items
            const stmt = db.prepare("INSERT INTO purchase_order_items (po_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)");
            items.forEach(item => {
                stmt.run(poId, item.product_id, item.quantity, item.unit_price);
            });
            stmt.finalize();

            auditService.log(
                req.user.id,
                'CREATE',
                'purchase_order',
                poId,
                { vendor_id, total, item_count: items.length },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.status(201).json({ id: poId, message: 'Purchase order created successfully' });
        }
    );
});

// UPDATE PO status
router.patch('/:id/status', checkPermission('inventory', 'write'), (req, res) => {
    const { status } = req.body;

    db.run(
        "UPDATE purchase_orders SET status = ? WHERE id = ?",
        [status, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Purchase order not found' });

            auditService.log(
                req.user.id,
                'UPDATE',
                'purchase_order',
                req.params.id,
                { status },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.json({ message: 'Status updated successfully' });
        }
    );
});

// RECEIVE items (update stock)
router.post('/:id/receive', checkPermission('inventory', 'write'), (req, res) => {
    const { items } = req.body; // items: [{ item_id, received_quantity }]

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Items are required' });
    }

    // Update received quantities and stock
    items.forEach(item => {
        // Update PO item
        db.run(
            "UPDATE purchase_order_items SET received_quantity = received_quantity + ? WHERE id = ?",
            [item.received_quantity, item.item_id]
        );

        // Get product_id from PO item
        db.get("SELECT product_id FROM purchase_order_items WHERE id = ?", [item.item_id], (err, row) => {
            if (!err && row) {
                // Update product stock
                db.run(
                    "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
                    [item.received_quantity, row.product_id]
                );

                // Log inventory change
                db.run(
                    "INSERT INTO inventory_logs (product_id, change_amount, type, reason) VALUES (?, ?, ?, ?)",
                    [row.product_id, item.received_quantity, 'in', `PO #${req.params.id} received`]
                );
            }
        });
    });

    // Update PO status and received_at
    db.run(
        "UPDATE purchase_orders SET status = 'received', received_at = CURRENT_TIMESTAMP WHERE id = ?",
        [req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            auditService.log(
                req.user.id,
                'UPDATE',
                'purchase_order_receive',
                req.params.id,
                { items },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.json({ message: 'Items received and stock updated' });
        }
    );
});

module.exports = router;
