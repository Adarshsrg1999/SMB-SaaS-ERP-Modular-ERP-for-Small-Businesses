const jwt = require('jsonwebtoken');
const db = require('../database');
const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkey';

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Authentication required' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token is invalid or expired' });
        req.user = user;
        next();
    });
};

/**
 * Middleware to check for specific module permissions
 * @param {string} module - The system module (inventory, customers, sales, users)
 * @param {string} permission - The required permission (read, write, delete)
 */
const checkPermission = (module, action) => {
    return (req, res, next) => {
        const role = req.user.role;

        // Admins can do everything
        if (role === 'admin') return next();

        const query = `
            SELECT * FROM role_permissions 
            WHERE role = ? AND (module = ? OR module = 'all') 
            AND (permission = ? OR permission = 'all')
        `;

        db.get(query, [role, module, action], (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error while checking permissions' });

            if (!row) {
                return res.status(403).json({
                    error: `Access Denied: You do not have '${action}' permission for the ${module} module.`
                });
            }

            next();
        });
    };
};

module.exports = { authenticateToken, checkPermission };
