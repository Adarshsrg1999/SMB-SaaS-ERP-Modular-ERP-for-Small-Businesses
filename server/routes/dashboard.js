const express = require('express');
const router = express.Router();
const db = require('../database');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

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
