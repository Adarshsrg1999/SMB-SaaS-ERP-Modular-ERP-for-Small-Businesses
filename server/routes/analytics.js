const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, checkPermission } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// GET overall profit margin
router.get('/profit-margin', checkPermission('sales', 'read'), (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT 
            COALESCE(SUM(total), 0) as total_revenue,
            COALESCE(SUM(cost), 0) as total_cost,
            COALESCE(SUM(profit), 0) as total_profit
        FROM sales_documents
        WHERE status != 'cancelled'
    `;
    const params = [];

    if (start_date) {
        query += ' AND created_at >= ?';
        params.push(start_date);
    }

    if (end_date) {
        query += ' AND created_at <= ?';
        params.push(end_date);
    }

    db.get(query, params, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        const margin = row.total_revenue > 0
            ? ((row.total_profit / row.total_revenue) * 100).toFixed(2)
            : 0;

        res.json({
            total_revenue: row.total_revenue,
            total_cost: row.total_cost,
            total_profit: row.total_profit,
            profit_margin_percentage: parseFloat(margin)
        });
    });
});

// GET profit by product
router.get('/profit-by-product', checkPermission('sales', 'read'), (req, res) => {
    const query = `
        SELECT 
            p.id,
            p.name,
            p.sku,
            p.price,
            p.cost_price,
            COUNT(si.id) as units_sold,
            COALESCE(SUM(si.quantity * si.price), 0) as revenue,
            COALESCE(SUM(si.quantity * p.cost_price), 0) as cost,
            COALESCE(SUM(si.quantity * (si.price - p.cost_price)), 0) as profit
        FROM products p
        LEFT JOIN sale_items si ON p.id = si.product_id
        LEFT JOIN sales_documents sd ON si.document_id = sd.id AND sd.status != 'cancelled'
        GROUP BY p.id
        HAVING units_sold > 0
        ORDER BY profit DESC
        LIMIT 50
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const products = rows.map(row => ({
            ...row,
            margin_percentage: row.revenue > 0
                ? ((row.profit / row.revenue) * 100).toFixed(2)
                : 0
        }));

        res.json(products);
    });
});

// GET profit trend over time
router.get('/profit-trend', checkPermission('sales', 'read'), (req, res) => {
    const { period = 'daily', start_date, end_date } = req.query;

    let dateFormat;
    switch (period) {
        case 'daily':
            dateFormat = '%Y-%m-%d';
            break;
        case 'weekly':
            dateFormat = '%Y-W%W';
            break;
        case 'monthly':
            dateFormat = '%Y-%m';
            break;
        case 'yearly':
            dateFormat = '%Y';
            break;
        default:
            dateFormat = '%Y-%m-%d';
    }

    let query = `
        SELECT 
            strftime('${dateFormat}', created_at) as period,
            COALESCE(SUM(total), 0) as revenue,
            COALESCE(SUM(cost), 0) as cost,
            COALESCE(SUM(profit), 0) as profit,
            COUNT(*) as order_count
        FROM sales_documents
        WHERE status != 'cancelled'
    `;
    const params = [];

    if (start_date) {
        query += ' AND created_at >= ?';
        params.push(start_date);
    }

    if (end_date) {
        query += ' AND created_at <= ?';
        params.push(end_date);
    }

    query += ' GROUP BY period ORDER BY period DESC LIMIT 30';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const trend = rows.map(row => ({
            ...row,
            margin_percentage: row.revenue > 0
                ? ((row.profit / row.revenue) * 100).toFixed(2)
                : 0
        })).reverse(); // Reverse to show oldest first

        res.json(trend);
    });
});

// GET top profitable products
router.get('/top-profitable-products', checkPermission('sales', 'read'), (req, res) => {
    const { limit = 10 } = req.query;

    const query = `
        SELECT 
            p.id,
            p.name,
            p.sku,
            COALESCE(SUM(si.quantity * (si.price - p.cost_price)), 0) as total_profit,
            COALESCE(SUM(si.quantity), 0) as units_sold
        FROM products p
        INNER JOIN sale_items si ON p.id = si.product_id
        INNER JOIN sales_documents sd ON si.document_id = sd.id
        WHERE sd.status != 'cancelled'
        GROUP BY p.id
        ORDER BY total_profit DESC
        LIMIT ?
    `;

    db.all(query, [parseInt(limit)], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
