const express = require('express');
const db = require('../database');
const { sendNotification } = require('../services/telegramService');
const router = express.Router();

// Middleware to check authentication (can be moved to a separate file)
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

// GET all customers
router.get('/', (req, res) => {
    db.all("SELECT * FROM customers ORDER BY name", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ADD customer
router.post('/', (req, res) => {
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

            res.status(201).json({ id: this.lastID, message: 'Customer added' });
        }
    );
});

// UPDATE customer
router.put('/:id', (req, res) => {
    const { name, email, phone, address, gst } = req.body;
    db.run("UPDATE customers SET name=?, email=?, phone=?, address=?, gst=? WHERE id=?",
        [name, email, phone, address, gst, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Customer updated' });
        }
    );
});

// DELETE customer
router.delete('/:id', (req, res) => {
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

            res.json({ message: 'Customer deleted' });
        });
    });
});

module.exports = router;
