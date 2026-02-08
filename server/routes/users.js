const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');
const { sendNotification } = require('../services/telegramService');
const auditService = require('../services/auditService');
const router = express.Router();

// All routes in this file are protected and require 'admin' role
router.use(authenticateToken);
router.use((req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
});

// Get all users
router.get('/', (req, res) => {
    db.all("SELECT id, name, email, role FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create a new user
router.post('/', (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, role],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }

            // Send user creation notification
            sendNotification('USER_CREATED', {
                name,
                email,
                role,
                createdBy: req.user.name
            });

            // Log activity
            auditService.log(
                req.user.id,
                'CREATE',
                'user',
                this.lastID,
                { name, email, role },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.status(201).json({ message: 'User created successfully', userId: this.lastID });
        }
    );
});

// Update a user
router.put('/:id', (req, res) => {
    const { name, email, role, password } = req.body;
    const userId = req.params.id;

    // Get old user data first to detect role changes
    db.get("SELECT name, email, role FROM users WHERE id = ?", [userId], (err, oldUser) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!oldUser) return res.status(404).json({ error: 'User not found' });

        const updateCallback = function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) return res.status(404).json({ error: 'User not found' });

            // Send notification if role changed
            if (oldUser.role !== role) {
                sendNotification('USER_UPDATED', {
                    name,
                    email,
                    oldRole: oldUser.role,
                    newRole: role,
                    changedBy: req.user.name
                });
            }

            // Log activity
            auditService.log(
                req.user.id,
                'UPDATE',
                'user',
                userId,
                { name, email, role, password_changed: !!password },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.json({ message: 'User updated successfully' });
        };

        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            db.run("UPDATE users SET name=?, email=?, role=?, password=? WHERE id=?",
                [name, email, role, hashedPassword, userId],
                updateCallback
            );
        } else {
            db.run("UPDATE users SET name=?, email=?, role=? WHERE id=?",
                [name, email, role, userId],
                updateCallback
            );
        }
    });
});

// Delete a user
router.delete('/:id', (req, res) => {
    const userId = req.params.id;

    // Prevent deleting self
    if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get user data before deletion for notification
    db.get("SELECT name, email, role FROM users WHERE id = ?", [userId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });

        db.run("DELETE FROM users WHERE id = ?", [userId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'User not found' });

            // Send user deletion notification
            sendNotification('USER_DELETED', {
                name: user.name,
                email: user.email,
                role: user.role,
                deletedBy: req.user.name
            });

            // Log activity
            auditService.log(
                req.user.id,
                'DELETE',
                'user',
                userId,
                { name: user.name, email: user.email, role: user.role },
                req.headers['x-forwarded-for'] || req.socket.remoteAddress
            );

            res.json({ message: 'User deleted successfully' });
        });
    });
});

module.exports = router;
