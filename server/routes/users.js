const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();

// All routes in this file are protected and require 'admin' role
router.use(verifyToken);
router.use(authorizeRole(['admin']));

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
            res.status(201).json({ message: 'User created successfully', userId: this.lastID });
        }
    );
});

// Update a user
router.put('/:id', (req, res) => {
    const { name, email, role, password } = req.body;
    const userId = req.params.id;

    // Optional: prevent changing own role to something else if needed, but for now allow admins to do anything

    if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.run("UPDATE users SET name=?, email=?, role=?, password=? WHERE id=?",
            [name, email, role, hashedPassword, userId],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Email already exists' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
                res.json({ message: 'User updated successfully' });
            }
        );
    } else {
        db.run("UPDATE users SET name=?, email=?, role=? WHERE id=?",
            [name, email, role, userId],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Email already exists' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
                res.json({ message: 'User updated successfully' });
            }
        );
    }
});

// Delete a user
router.delete('/:id', (req, res) => {
    const userId = req.params.id;

    // Prevent deleting self
    if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.run("DELETE FROM users WHERE id = ?", [userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    });
});

module.exports = router;
