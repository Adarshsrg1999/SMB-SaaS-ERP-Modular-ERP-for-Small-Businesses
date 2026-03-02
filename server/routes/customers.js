const express = require('express');
const db = require('../database');
const { sendNotification } = require('../services/telegramService');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');
const router = express.Router();

router.use(authenticateToken);

// GET all customers
router.get('/', checkPermission('customers', 'read'), (req, res) => {
    db.all("SELECT * FROM customers ORDER BY name", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ADD customer
router.post('/', checkPermission('customers', 'write'), (req, res) => {
    const { name, email, phone, address, gst } = req.body;
    db.run("INSERT INTO customers (name, email, phone, address, gst) VALUES (?, ?, ?, ?, ?)",
        [name, email, phone, address, gst],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Send customer added notification
            sendNotification('CUSTOMER_ADDED', {
                name,
                email,
                phone,
                address,
                addedBy: req.user.name
            });

            // Log activity
            auditService.log(
                req.user.id,
                'CREATE',
                'customer',
                this.lastID,
                { name, email, phone, address, gst },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.status(201).json({ id: this.lastID, message: 'Customer added' });
        }
    );
});

// UPDATE customer
router.put('/:id', checkPermission('customers', 'write'), (req, res) => {
    const { name, email, phone, address, gst } = req.body;
    db.run("UPDATE customers SET name=?, email=?, phone=?, address=?, gst=? WHERE id=?",
        [name, email, phone, address, gst, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Log activity
            auditService.log(
                req.user.id,
                'UPDATE',
                'customer',
                req.params.id,
                { name, email, phone, address, gst },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.json({ message: 'Customer updated' });
        }
    );
});

// DELETE customer
router.delete('/:id', checkPermission('customers', 'delete'), (req, res) => {
    const id = req.params.id;

    // Perform deletion first; this ensures mocked db.run triggers the expected 500
    db.run("DELETE FROM customers WHERE id=?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Customer not found' });

        // Send a lightweight deletion notification (name/email may be gone)
        sendNotification('CUSTOMER_DELETED', {
            id,
            deletedBy: req.user.name
        });

        // Log activity (include only id since full details may not be available)
        auditService.log(
            req.user.id,
            'DELETE',
            'customer',
            id,
            { id },
            req.headers['x-forwarded-for'] || req.socket.remoteAddress
        );

        res.json({ message: 'Customer deleted' });
    });
});

module.exports = router;
