const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// GET all targets for current user
router.get('/', (req, res) => {
    db.all(
        "SELECT * FROM sales_targets WHERE user_id = ? ORDER BY end_date DESC",
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// GET single target with progress
router.get('/:id/progress', (req, res) => {
    // First get the target
    db.get(
        "SELECT * FROM sales_targets WHERE id = ? AND user_id = ?",
        [req.params.id, req.user.id],
        (err, target) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!target) return res.status(404).json({ error: 'Target not found' });

            // Calculate progress by querying sales within date range
            // Note: We need to join with users to filter by the current user's sales
            const query = `
                SELECT COALESCE(SUM(sd.total), 0) as achieved
                FROM sales_documents sd
                WHERE sd.created_at >= ? 
                  AND sd.created_at <= ?
                  AND sd.status != 'cancelled'
            `;

            db.get(query, [target.start_date, target.end_date], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });

                const achieved = result.achieved || 0;
                const percentage = target.target_amount > 0
                    ? Math.round((achieved / target.target_amount) * 100)
                    : 0;

                res.json({
                    ...target,
                    achieved,
                    percentage,
                    remaining: Math.max(0, target.target_amount - achieved)
                });
            });
        }
    );
});

// POST create new target
router.post('/', (req, res) => {
    const { target_amount, period, start_date, end_date } = req.body;

    if (!target_amount || !period || !start_date || !end_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].includes(period)) {
        return res.status(400).json({ error: 'Invalid period' });
    }

    db.run(
        `INSERT INTO sales_targets (user_id, target_amount, period, start_date, end_date)
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, target_amount, period, start_date, end_date],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            res.status(201).json({
                id: this.lastID,
                message: 'Sales target created successfully'
            });
        }
    );
});

// PUT update target
router.put('/:id', (req, res) => {
    const { target_amount, period, start_date, end_date } = req.body;

    db.run(
        `UPDATE sales_targets 
         SET target_amount = ?, period = ?, start_date = ?, end_date = ?
         WHERE id = ? AND user_id = ?`,
        [target_amount, period, start_date, end_date, req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Target not found' });
            }
            res.json({ message: 'Target updated successfully' });
        }
    );
});

// DELETE target
router.delete('/:id', (req, res) => {
    db.run(
        "DELETE FROM sales_targets WHERE id = ? AND user_id = ?",
        [req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Target not found' });
            }
            res.json({ message: 'Target deleted successfully' });
        }
    );
});

module.exports = router;
