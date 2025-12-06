const express = require('express');
const router = express.Router();
const db = require('../database');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/reset', authorizeRole(['admin']), (req, res) => {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        try {
            db.run("DELETE FROM customers");
            db.run("DELETE FROM products");
            db.run("DELETE FROM inventory_logs");
            db.run("DELETE FROM sales_documents");
            db.run("DELETE FROM sale_items");
            // Delete all non-admin users. 
            // NOTE: This preserves ALL admins. 
            db.run("DELETE FROM users WHERE role != 'admin'");

            db.run("COMMIT", (err) => {
                if (err) {
                    console.error('Reset transaction commit failed:', err);
                    return res.status(500).json({ error: 'Database reset failed during commit' });
                }
                res.json({ message: 'Database reset successful. All data cleared except Admin accounts.' });
            });
        } catch (e) {
            db.run("ROLLBACK");
            console.error('Reset transaction error:', e);
            res.status(500).json({ error: 'Database reset failed' });
        }
    });
});

router.get('/metrics', async (req, res) => {
    try {
        const getAsync = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        };

        const allAsync = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        };

        // 1. Total Customers
        const customersQuery = "SELECT COUNT(*) as count FROM customers";

        // 2. Total Products
        const productsQuery = "SELECT COUNT(*) as count FROM products";

        // 3. Sales Today (UTC based)
        const salesTodayQuery = `
            SELECT SUM(total) as total 
            FROM sales_documents 
            WHERE date(created_at) = date('now') 
            AND status != 'cancelled' 
            AND (type = 'invoice' OR type = 'order')
        `;

        // 4. Sales This Week (Last 7 days)
        const salesWeekQuery = `
            SELECT SUM(total) as total 
            FROM sales_documents 
            WHERE date(created_at) >= date('now', '-7 days') 
            AND status != 'cancelled' 
            AND (type = 'invoice' OR type = 'order')
        `;

        // 5. Low Stock Alerts
        const lowStockQuery = `
            SELECT * FROM products 
            WHERE stock_quantity <= min_stock_level
        `;

        const [
            customersResult,
            productsResult,
            salesTodayResult,
            salesWeekResult,
            lowStockResult
        ] = await Promise.all([
            getAsync(customersQuery),
            getAsync(productsQuery),
            getAsync(salesTodayQuery),
            getAsync(salesWeekQuery),
            allAsync(lowStockQuery)
        ]);

        res.json({
            totalCustomers: customersResult.count || 0,
            totalProducts: productsResult.count || 0,
            salesToday: salesTodayResult.total || 0,
            salesWeek: salesWeekResult.total || 0,
            lowStockItems: lowStockResult || []
        });

    } catch (err) {
        console.error('Dashboard metrics error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
});

module.exports = router;
