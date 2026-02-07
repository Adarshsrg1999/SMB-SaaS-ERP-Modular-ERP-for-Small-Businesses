const express = require('express');
const db = require('../database');
const { sendNotification } = require('../services/telegramService');
const router = express.Router();

// Middleware
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

// GET all documents (with filters optional)
router.get('/', (req, res) => {
    const { type } = req.query;
    let query = "SELECT sales_documents.*, customers.name as customer_name FROM sales_documents LEFT JOIN customers ON sales_documents.customer_id = customers.id";
    let params = [];

    if (type) {
        query += " WHERE type = ?";
        params.push(type);
    }

    query += " ORDER BY created_at DESC";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREATE Document (Quote/Order)
router.post('/', (req, res) => {
    const { customer_id, type, items } = req.body; // items: [{ product_id, quantity, price }]
    const largeOrderThreshold = parseInt(process.env.LARGE_ORDER_THRESHOLD) || 100000;

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const status = type === 'quotation' ? 'pending' : 'confirmed';

    db.run("INSERT INTO sales_documents (customer_id, type, status, total) VALUES (?, ?, ?, ?)",
        [customer_id, type, status, total],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            const docId = this.lastID;

            // Insert Items
            const placeholders = items.map(() => '(?, ?, ?, ?)').join(',');
            const values = [];
            items.forEach(item => {
                values.push(docId, item.product_id, item.quantity, item.price);
            });

            db.run(`INSERT INTO sale_items (document_id, product_id, quantity, price) VALUES ${placeholders}`, values, (err) => {
                if (err) return res.status(500).json({ error: err.message });

                // Get customer name for notification
                db.get("SELECT name FROM customers WHERE id = ?", [customer_id], (err, customer) => {
                    const customerName = customer ? customer.name : 'Unknown Customer';

                    // Send sale created notification
                    sendNotification('SALE_CREATED', {
                        type,
                        documentId: docId,
                        customerName,
                        total,
                        itemCount: items.length,
                        createdBy: req.user.name
                    });

                    // Send large order notification if threshold exceeded
                    if (total >= largeOrderThreshold) {
                        sendNotification('LARGE_ORDER', {
                            type,
                            documentId: docId,
                            customerName,
                            total,
                            itemCount: items.length,
                            status
                        });
                    }
                });

                res.status(201).json({ id: docId, message: 'Document created' });
            });
        }
    );
});

// UPDATE Status (e.g., Quote -> Order, Order -> Invoice)
router.patch('/:id/status', (req, res) => {
    const { status, type } = req.body;
    const documentId = req.params.id;

    // Get old document data first
    db.get("SELECT sd.*, c.name as customer_name FROM sales_documents sd LEFT JOIN customers c ON sd.customer_id = c.id WHERE sd.id = ?",
        [documentId], (err, oldDoc) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!oldDoc) return res.status(404).json({ error: 'Document not found' });

            const updates = [];
            const params = [];

            if (status) {
                updates.push("status = ?");
                params.push(status);
            }
            if (type) {
                updates.push("type = ?");
                params.push(type);
            }
            params.push(documentId);

            db.run(`UPDATE sales_documents SET ${updates.join(', ')} WHERE id = ?`, params, function (err) {
                if (err) return res.status(500).json({ error: err.message });

                // Check for quotation to order conversion
                if (oldDoc.type === 'quotation' && type === 'order') {
                    sendNotification('ORDER_CONVERTED', {
                        documentId,
                        customerName: oldDoc.customer_name,
                        total: oldDoc.total,
                        convertedBy: req.user.name
                    });
                }

                // Check for order cancellation
                if (status === 'cancelled' && oldDoc.status !== 'cancelled') {
                    sendNotification('ORDER_CANCELLED', {
                        type: type || oldDoc.type,
                        documentId,
                        customerName: oldDoc.customer_name,
                        total: oldDoc.total,
                        cancelledBy: req.user.name
                    });
                }

                res.json({ message: 'Document updated' });
            });
        });
});

module.exports = router;
