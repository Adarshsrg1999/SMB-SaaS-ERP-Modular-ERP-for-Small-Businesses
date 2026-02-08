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
    // Get customer data before deletion for notification
    db.get("SELECT name, email FROM customers WHERE id = ?", [req.params.id], (err, customer) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        db.run("DELETE FROM customers WHERE id=?", [req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Send customer deleted notification
            sendNotification('CUSTOMER_DELETED', {
                name: customer.name,
                email: customer.email,
                deletedBy: req.user.name
            });

            // Log activity
            auditService.log(
                req.user.id,
                'DELETE',
                'customer',
                req.params.id,
                { name: customer.name, email: customer.email },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.json({ message: 'Customer deleted' });
        });
    });
});

module.exports = router;
