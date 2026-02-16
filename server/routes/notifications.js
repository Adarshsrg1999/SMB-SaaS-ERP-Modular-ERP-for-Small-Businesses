const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// GET all notifications for current user
router.get('/', (req, res) => {
    const query = `
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 100
    `;

    db.all(query, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET unread count
router.get('/unread-count', (req, res) => {
    const query = `
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? AND is_read = 0
    `;

    db.get(query, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ count: row.count });
    });
});

// PATCH mark notification as read
router.patch('/:id/read', (req, res) => {
    db.run(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
        [req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Notification not found' });
            }
            res.json({ message: 'Notification marked as read' });
        }
    );
});

// PATCH mark all as read
router.patch('/read-all', (req, res) => {
    db.run(
        "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
        [req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: `${this.changes} notifications marked as read` });
        }
    );
});

// DELETE notification
router.delete('/:id', (req, res) => {
    db.run(
        "DELETE FROM notifications WHERE id = ? AND user_id = ?",
        [req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Notification not found' });
            }
            res.json({ message: 'Notification deleted' });
        }
    );
});

// Helper function to create notification (exported for use in other routes)
function createNotification(userId, type, title, message, relatedTo = null, relatedId = null) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO notifications (user_id, type, title, message, related_to, related_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, type, title, message, relatedTo, relatedId],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

// Helper to notify all admins
function notifyAdmins(type, title, message, relatedTo = null, relatedId = null) {
    return new Promise((resolve, reject) => {
        db.all("SELECT id FROM users WHERE role = 'admin'", [], (err, admins) => {
            if (err) return reject(err);

            const promises = admins.map(admin =>
                createNotification(admin.id, type, title, message, relatedTo, relatedId)
            );

            Promise.all(promises).then(resolve).catch(reject);
        });
    });
}

module.exports = router;
module.exports.createNotification = createNotification;
module.exports.notifyAdmins = notifyAdmins;
