const express = require('express');
const router = express.Router();
const db = require('../database');
const { isAdmin } = require('./auth');

// View audit logs (Admin only)
router.get('/', isAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    // Get total count
    db.get('SELECT COUNT(*) as count FROM audit_logs', [], (err, countResult) => {
        if (err) return res.status(500).send('Server Error');

        const total = countResult.count;
        const totalPages = Math.ceil(total / limit);

        // Get paginated logs
        db.all(
            `SELECT * FROM audit_logs 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [limit, offset],
            (err, logs) => {
                if (err) return res.status(500).send('Server Error');

                res.render('admin/audit_logs', {
                    title: 'Audit Logs',
                    logs,
                    page,
                    totalPages,
                    total,
                    user: req.session.user
                });
            }
        );
    });
});

// Filter audit logs by date range
router.get('/filter', isAdmin, (req, res) => {
    const { startDate, endDate, userRole, action } = req.query;
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    let params = [];

    if (startDate) {
        query += ' AND DATE(created_at) >= ?';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND DATE(created_at) <= ?';
        params.push(endDate);
    }

    if (userRole && userRole !== 'all') {
        query += ' AND user_role = ?';
        params.push(userRole);
    }

    if (action && action !== 'all') {
        query += ' AND action = ?';
        params.push(action);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    db.all(query, params, (err, logs) => {
        if (err) return res.status(500).send('Server Error');

        res.json({
            logs,
            count: logs.length
        });
    });
});

// Get user activity summary
router.get('/user/:userId', isAdmin, (req, res) => {
    const userId = req.params.userId;

    db.all(
        `SELECT * FROM audit_logs 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 100`,
        [userId],
        (err, logs) => {
            if (err) return res.status(500).send('Server Error');

            res.json({
                userId,
                totalActions: logs.length,
                logs
            });
        }
    );
});

// Get action statistics
router.get('/stats/summary', isAdmin, (req, res) => {
    const queries = {
        logins: 'SELECT COUNT(*) as count FROM audit_logs WHERE action = "LOGIN"',
        failures: 'SELECT COUNT(*) as count FROM audit_logs WHERE action = "LOGIN_FAILED"',
        creates: 'SELECT COUNT(*) as count FROM audit_logs WHERE action = "CREATE"',
        updates: 'SELECT COUNT(*) as count FROM audit_logs WHERE action = "UPDATE"',
        deletes: 'SELECT COUNT(*) as count FROM audit_logs WHERE action = "DELETE"',
        byRole: `SELECT user_role, COUNT(*) as count FROM audit_logs 
                 WHERE user_role IS NOT NULL 
                 GROUP BY user_role`
    };

    const stats = {};
    let completed = 0;

    Object.keys(queries).forEach(key => {
        db.get(queries[key], [], (err, result) => {
            if (!err) {
                if (key === 'byRole') {
                    stats[key] = result || [];
                } else {
                    stats[key] = result?.count || 0;
                }
            }

            completed++;
            if (completed === Object.keys(queries).length) {
                res.json(stats);
            }
        });
    });
});

module.exports = router;
