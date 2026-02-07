const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { sendNotification, sendLoginNotification } = require('../services/telegramService');
const router = express.Router();

const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkey';

// Register (Admin only can create specific roles, otherwise default to staff)
router.post('/register', (req, res) => {
    const { name, email, password, role } = req.body;
    const userRole = role || 'staff'; // Default role

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, userRole],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Send user registration notification
            sendNotification('USER_CREATED', {
                name,
                email,
                role: userRole,
                createdBy: req.user ? req.user.name : 'Self-Registration'
            });

            res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
        }
    );
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!user) {
            // Send failed login notification - user not found
            sendNotification('LOGIN_FAILED', {
                email,
                ipAddress,
                reason: 'User not found'
            });
            return res.status(400).json({ error: 'User not found' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            // Send failed login notification - invalid password
            sendNotification('LOGIN_FAILED', {
                email,
                ipAddress,
                reason: 'Invalid password'
            });
            return res.status(400).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '24h' });

        // Send successful login notification (fire-and-forget, don't block login response)
        sendLoginNotification(user.name, user.email, ipAddress);

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
});

module.exports = router;
