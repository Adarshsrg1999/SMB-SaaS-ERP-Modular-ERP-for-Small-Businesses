const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/authMiddleware');
const { createNotification } = require('./notifications');

router.use(authenticateToken);

// GET all tasks for current user
router.get('/', (req, res) => {
    const { status, priority, related_to } = req.query;
    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [req.user.id];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    if (priority) {
        query += ' AND priority = ?';
        params.push(priority);
    }

    if (related_to) {
        query += ' AND related_to = ?';
        params.push(related_to);
    }

    query += ' ORDER BY CASE priority WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 WHEN \'low\' THEN 3 END, due_date ASC, created_at DESC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET single task
router.get('/:id', (req, res) => {
    db.get(
        "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
        [req.params.id, req.user.id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Task not found' });
            res.json(row);
        }
    );
});

// POST create new task
router.post('/', (req, res) => {
    const { title, description, related_to, related_id, priority, due_date } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    db.run(
        `INSERT INTO tasks (user_id, title, description, related_to, related_id, priority, due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, title, description, related_to, related_id, priority || 'medium', due_date],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            res.status(201).json({
                id: this.lastID,
                message: 'Task created successfully'
            });
        }
    );
});

// PUT update task
router.put('/:id', (req, res) => {
    const { title, description, related_to, related_id, priority, due_date, status } = req.body;

    db.run(
        `UPDATE tasks 
         SET title = ?, description = ?, related_to = ?, related_id = ?, 
             priority = ?, due_date = ?, status = ?
         WHERE id = ? AND user_id = ?`,
        [title, description, related_to, related_id, priority, due_date, status, req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.json({ message: 'Task updated successfully' });
        }
    );
});

// PATCH update task status
router.patch('/:id/status', (req, res) => {
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const completed_at = status === 'completed' ? new Date().toISOString() : null;

    db.run(
        "UPDATE tasks SET status = ?, completed_at = ? WHERE id = ? AND user_id = ?",
        [status, completed_at, req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }

            // Create notification for task completion
            if (status === 'completed') {
                db.get("SELECT title FROM tasks WHERE id = ?", [req.params.id], (err, task) => {
                    if (!err && task) {
                        createNotification(
                            req.user.id,
                            'success',
                            'Task Completed',
                            `You completed: ${task.title}`,
                            'task',
                            req.params.id
                        ).catch(console.error);
                    }
                });
            }

            res.json({ message: 'Task status updated successfully' });
        }
    );
});

// DELETE task
router.delete('/:id', (req, res) => {
    db.run(
        "DELETE FROM tasks WHERE id = ? AND user_id = ?",
        [req.params.id, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.json({ message: 'Task deleted successfully' });
        }
    );
});

// Helper function to create task (exported for use in other routes)
function createTask(userId, title, description, relatedTo, relatedId, priority = 'medium', dueDate = null) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO tasks (user_id, title, description, related_to, related_id, priority, due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, title, description, relatedTo, relatedId, priority, dueDate],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

module.exports = router;
module.exports.createTask = createTask;
