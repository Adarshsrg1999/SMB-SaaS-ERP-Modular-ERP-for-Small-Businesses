const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');

// Apply authentication to all routes
router.use(authenticateToken);

// GET all tags
router.get('/', checkPermission('inventory', 'read'), (req, res) => {
    const query = `
        SELECT t.*,
               (SELECT COUNT(*) FROM product_tags WHERE tag_id = t.id) as product_count
        FROM tags t
        ORDER BY t.name
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREATE tag
router.post('/', checkPermission('inventory', 'write'), (req, res) => {
    const { name, color } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Tag name is required' });
    }

    db.run(
        "INSERT INTO tags (name, color) VALUES (?, ?)",
        [name, color || '#3b82f6'],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Tag already exists' });
                }
                return res.status(500).json({ error: err.message });
            }

            // Audit log
            auditService.log(
                req.user.id,
                'CREATE',
                'tag',
                this.lastID,
                { name, color },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.status(201).json({
                id: this.lastID,
                name,
                color: color || '#3b82f6',
                message: 'Tag created successfully'
            });
        }
    );
});

// UPDATE tag
router.put('/:id', checkPermission('inventory', 'write'), (req, res) => {
    const { name, color } = req.body;
    const tagId = req.params.id;

    db.run(
        "UPDATE tags SET name = ?, color = ? WHERE id = ?",
        [name, color, tagId],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Tag name already exists' });
                }
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Tag not found' });
            }

            // Audit log
            auditService.log(
                req.user.id,
                'UPDATE',
                'tag',
                tagId,
                { name, color },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.json({ message: 'Tag updated successfully' });
        }
    );
});

// DELETE tag
router.delete('/:id', checkPermission('inventory', 'delete'), (req, res) => {
    const tagId = req.params.id;

    // Delete tag (CASCADE will remove product_tags entries)
    db.run("DELETE FROM tags WHERE id = ?", [tagId], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        // Audit log
        auditService.log(
            req.user.id,
            'DELETE',
            'tag',
            tagId,
            {},
            req.headers['x-forwarded-for'] || req.socket.remoteAddress
        );

        res.json({ message: 'Tag deleted successfully' });
    });
});

module.exports = router;
