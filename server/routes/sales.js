const express = require('express');
const db = require('../database');
const { sendNotification } = require('../services/telegramService');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');
const router = express.Router();

router.use(authenticateToken);

// GET all documents (with filters optional)
router.get('/', checkPermission('sales', 'read'), (req, res) => {
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
router.post('/', checkPermission('sales', 'write'), (req, res) => {
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

                // Log activity
                auditService.log(
                    req.user.id,
                    'CREATE',
                    'sale_document',
                    docId,
                    { type, customer_id, total, items_count: items.length },
                    req.headers['x-forwarded-for'] || req.socket.remoteAddress
                );
            });
        }
    );
});

// UPDATE Status (e.g., Quote -> Order, Order -> Invoice)
router.patch('/:id/status', checkPermission('sales', 'write'), (req, res) => {
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

                // Log activity
                auditService.log(
                    req.user.id,
                    'UPDATE',
                    'sale_document',
                    documentId,
                    { old_status: oldDoc.status, new_status: status || oldDoc.status, old_type: oldDoc.type, new_type: type || oldDoc.type },
                    req.headers['x-forwarded-for'] || req.socket.remoteAddress
                );
            });
        });
});

// UPDATE Fulfillment Status (Story 29)
router.patch('/:id/fulfillment', checkPermission('sales', 'write'), (req, res) => {
    const { fulfillment_status, tracking_number } = req.body;
    const documentId = req.params.id;

    // Valid status transitions
    const validTransitions = {
        'pending': ['packed', 'cancelled'],
        'packed': ['shipped', 'cancelled'],
        'shipped': ['delivered'],
        'delivered': [],
        'cancelled': []
    };

    // Get current document
    db.get(
        "SELECT * FROM sales_documents WHERE id = ?",
        [documentId],
        (err, doc) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!doc) return res.status(404).json({ error: 'Document not found' });

            // Validate transition
            const currentStatus = doc.fulfillment_status || 'pending';
            if (!validTransitions[currentStatus].includes(fulfillment_status)) {
                return res.status(400).json({
                    error: `Invalid status transition from '${currentStatus}' to '${fulfillment_status}'`
                });
            }

            // Build update query with timestamp
            let updateFields = ['fulfillment_status = ?'];
            let updateValues = [fulfillment_status];

            if (fulfillment_status === 'packed') {
                updateFields.push('packed_at = CURRENT_TIMESTAMP');
            } else if (fulfillment_status === 'shipped') {
                updateFields.push('shipped_at = CURRENT_TIMESTAMP');
                if (tracking_number) {
                    updateFields.push('tracking_number = ?');
                    updateValues.push(tracking_number);
                }
            } else if (fulfillment_status === 'delivered') {
                updateFields.push('delivered_at = CURRENT_TIMESTAMP');
            }

            updateValues.push(documentId);

            db.run(
                `UPDATE sales_documents SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues,
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });

                    // Get customer info for notification
                    db.get(
                        `SELECT c.name as customer_name, c.email, sd.type, sd.total 
                         FROM sales_documents sd 
                         JOIN customers c ON sd.customer_id = c.id 
                         WHERE sd.id = ?`,
                        [documentId],
                        (err, info) => {
                            if (!err && info) {
                                // Send notification based on status
                                if (fulfillment_status === 'packed') {
                                    sendNotification('ORDER_PACKED', {
                                        documentId,
                                        customerName: info.customer_name,
                                        type: info.type,
                                        total: info.total,
                                        updatedBy: req.user.name
                                    });
                                } else if (fulfillment_status === 'shipped') {
                                    sendNotification('ORDER_SHIPPED', {
                                        documentId,
                                        customerName: info.customer_name,
                                        type: info.type,
                                        total: info.total,
                                        trackingNumber: tracking_number || 'N/A',
                                        updatedBy: req.user.name
                                    });
                                } else if (fulfillment_status === 'delivered') {
                                    sendNotification('ORDER_DELIVERED', {
                                        documentId,
                                        customerName: info.customer_name,
                                        type: info.type,
                                        total: info.total,
                                        updatedBy: req.user.name
                                    });
                                }
                            }

                            // Audit log
                            auditService.log(
                                req.user.id,
                                'UPDATE',
                                'sale_document_fulfillment',
                                documentId,
                                {
                                    old_status: currentStatus,
                                    new_status: fulfillment_status,
                                    tracking_number: tracking_number || null
                                },
                                req.headers['x-forwarded-for'] || req.socket.remoteAddress
                            );

                            res.json({
                                message: 'Fulfillment status updated successfully',
                                fulfillment_status
                            });
                        }
                    );
                }
            );
        }
    );
});

module.exports = router;
