const express = require('express');
const db = require('../database');
const os = require('os');
const fs = require('fs');
const path = require('path');
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

const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
};

router.use(authenticateToken);

// GET System Health (Story 7)
router.get('/health', authorizeAdmin, (req, res) => {
    const uptime = process.uptime();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // DB Size
    const dbPath = path.resolve(__dirname, '../erp.db');
    let dbSize = 0;
    try {
        if (fs.existsSync(dbPath)) {
            const stats = fs.statSync(dbPath);
            dbSize = stats.size;
        }
    } catch (e) {
        console.error('Error getting DB size:', e);
    }

    res.json({
        platform: os.platform(),
        nodeVersion: process.version,
        uptime: Math.floor(uptime),
        memory: {
            total: Math.round(totalMem / (1024 * 1024)),
            used: Math.round(usedMem / (1024 * 1024)),
            free: Math.round(freeMem / (1024 * 1024)),
            percentage: Math.round((usedMem / totalMem) * 100)
        },
        db: {
            size: Math.round(dbSize / 1024), // KB
            path: dbName = process.env.NODE_ENV === 'test' ? 'erp.test.db' : 'erp.db'
        },
        timestamp: new Date().toISOString()
    });
});

// GET Settings (Story 5)
router.get('/settings', (req, res) => {
    db.all("SELECT * FROM settings", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json(settings);
    });
});

// UPDATE Settings (Story 5)
router.post('/settings', authorizeAdmin, (req, res) => {
    const settings = req.body; // { businessName: '...', logo: '...', ... }
    const keys = Object.keys(settings);

    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at");
        keys.forEach(key => {
            stmt.run(key, settings[key]);
        });
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Settings updated' });
        });
    });
});

// GET Audit Logs (Story 1)
router.get('/audit-logs', authorizeAdmin, (req, res) => {
    const { limit = 50, offset = 0 } = req.query;
    const query = `
        SELECT al.*, u.name as user_name 
        FROM audit_logs al 
        LEFT JOIN users u ON al.user_id = u.id 
        ORDER BY al.timestamp DESC 
        LIMIT ? OFFSET ?
    `;
    db.all(query, [limit, offset], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// UPDATE Theme Preference (Story 31)
router.patch('/theme', (req, res) => {
    const { theme } = req.body; // 'light' or 'dark'
    if (!['light', 'dark'].includes(theme)) return res.status(400).json({ error: 'Invalid theme' });

    db.run("UPDATE users SET theme_preference = ? WHERE id = ?", [theme, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Theme updated' });
    });
});

module.exports = router;
