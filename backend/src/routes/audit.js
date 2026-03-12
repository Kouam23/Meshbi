const express = require('express');
const router = express.Router();
const db = require('../database');
const { isAdmin } = require('./auth');

// View audit logs (Admin only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await db.query('SELECT COUNT(*) as count FROM audit_logs');
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        // Get paginated logs
        const result = await db.query(
            `SELECT * FROM audit_logs 
             ORDER BY created_at DESC 
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.render('admin/audit_logs', {
            title: 'Audit Logs',
            logs: result.rows,
            page,
            totalPages,
            total,
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Filter audit logs by date range
router.get('/filter', isAdmin, async (req, res) => {
    try {
        const { startDate, endDate, userRole, action } = req.query;
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        if (startDate) {
            query += ` AND DATE(created_at) >= $${paramIndex++}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND DATE(created_at) <= $${paramIndex++}`;
            params.push(endDate);
        }

        if (userRole && userRole !== 'all') {
            query += ` AND user_role = $${paramIndex++}`;
            params.push(userRole);
        }

        if (action && action !== 'all') {
            query += ` AND action = $${paramIndex++}`;
            params.push(action);
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const result = await db.query(query, params);

        res.json({
            logs: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get user activity summary
router.get('/user/:userId', isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;

        const result = await db.query(
            `SELECT * FROM audit_logs 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 100`,
            [userId]
        );

        res.json({
            userId,
            totalActions: result.rows.length,
            logs: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get action statistics
router.get('/stats/summary', isAdmin, async (req, res) => {
    try {
        const queries = {
            logins: 'SELECT COUNT(*) as count FROM audit_logs WHERE action = \'LOGIN\'',
            failures: 'SELECT COUNT(*) as count FROM audit_logs WHERE action = \'LOGIN_FAILED\'',
            creates: 'SELECT COUNT(*) as count FROM audit_logs WHERE action = \'CREATE\'',
            updates: 'SELECT COUNT(*) as count FROM audit_logs WHERE action = \'UPDATE\'',
            deletes: 'SELECT COUNT(*) as count FROM audit_logs WHERE action = \'DELETE\'',
            byRole: `SELECT user_role, COUNT(*) as count FROM audit_logs 
                     WHERE user_role IS NOT NULL 
                     GROUP BY user_role`
        };

        const stats = {};

        for (const [key, query] of Object.entries(queries)) {
            const result = await db.query(query);
            
            if (key === 'byRole') {
                stats[key] = result.rows;
            } else {
                stats[key] = parseInt(result.rows[0].count) || 0;
            }
        }

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
