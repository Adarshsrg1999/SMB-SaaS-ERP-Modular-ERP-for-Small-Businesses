const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');

router.use(authenticateToken);

// GET all vendors
router.get('/', checkPermission('inventory', 'read'), (req, res) => {
    db.all("SELECT * FROM vendors ORDER BY name", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREATE vendor
router.post('/', checkPermission('inventory', 'write'), (req, res) => {
    const { name, contact_person, email, phone, address, tax_id, payment_terms, rating, notes } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Vendor name is required' });
    }

    db.run(
        "INSERT INTO vendors (name, contact_person, email, phone, address, tax_id, payment_terms, rating, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [name, contact_person, email, phone, address, tax_id, payment_terms, rating || 0, notes],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            auditService.log(
                req.user.id,
                'CREATE',
                'vendor',
                this.lastID,
                { name, email, phone },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.status(201).json({ id: this.lastID, message: 'Vendor created successfully' });
        }
    );
});

// UPDATE vendor
router.put('/:id', checkPermission('inventory', 'write'), (req, res) => {
    const { name, contact_person, email, phone, address, tax_id, payment_terms, rating, notes } = req.body;

    db.run(
        "UPDATE vendors SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, tax_id = ?, payment_terms = ?, rating = ?, notes = ? WHERE id = ?",
        [name, contact_person, email, phone, address, tax_id, payment_terms, rating, notes, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Vendor not found' });

            auditService.log(
                req.user.id,
                'UPDATE',
                'vendor',
                req.params.id,
                { name, email, phone },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.json({ message: 'Vendor updated successfully' });
        }
    );
});

// DELETE vendor
router.delete('/:id', checkPermission('inventory', 'delete'), (req, res) => {
    db.run("DELETE FROM vendors WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Vendor not found' });

        auditService.log(
            req.user.id,
            'DELETE',
            'vendor',
            req.params.id,
            {},
            req.headers['x-forwarded-for'] || req.socket.remoteAddress
        );

        res.json({ message: 'Vendor deleted successfully' });
    });
});

module.exports = router;
