const express = require('express');
const router = express.Router();
const db = require('../database');

// Middleware to check if user is secretary or admin
function isStaff(req, res, next) {
    if (req.session.user && (req.session.user.role === 'secretary' || req.session.user.role === 'admin')) {
        return next();
    }
    res.status(403).send('Forbidden');
}

// Secretary Dashboard - Overview
// Re-using the /secretary route in app.js or redirecting here? 
// Let's make /payments/dashboard the main view or just /secretary in app.js redirects here?
// Actually simpler: 
// 1. GET /payments/add?student_id=X (Add payment)
// 2. GET /payments/student/X (View history)

// Search/Select student for payment
router.get('/search', isStaff, async (req, res) => {
    try {
        const query = req.query.q || '';

        if (!query || query.length < 2) {
            return res.render('payments/search', { 
                title: 'Search Student for Payment', 
                students: [], 
                query,
                user: req.session.user
            });
        }

        // Search by name or matricule (using ILIKE for case-insensitive search in PostgreSQL)
        const result = await db.query(
            "SELECT * FROM students WHERE name ILIKE $1 OR matricule ILIKE $2 ORDER BY name LIMIT 20",
            [`%${query}%`, `%${query}%`]
        );
        
        res.render('payments/search', { 
            title: 'Search Student for Payment', 
            students: result.rows, 
            query,
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Show add payment form
router.get('/add', isStaff, async (req, res) => {
    try {
        const studentId = req.query.student_id;

        if (!studentId) {
            return res.redirect('/payments/search');
        }

        const result = await db.query("SELECT * FROM students WHERE id = $1", [studentId]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('Student not found');
        }

        res.render('payments/add', { title: 'Record Payment', student: result.rows[0], user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Record payment
router.post('/add', isStaff, async (req, res) => {
    try {
        const { student_id, amount, payment_type, comments } = req.body;
        const recorded_by = req.session.user.id;

        await db.query(
            `INSERT INTO payments (student_id, amount, payment_type, comments, recorded_by)
             VALUES ($1, $2, $3, $4, $5)`,
            [student_id, amount, payment_type, comments, recorded_by]
        );
        
        res.redirect(`/payments/student/${student_id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error recording payment');
    }
});

// Edit payment form
router.get('/:id/edit', isStaff, async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM payments WHERE id = $1", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('Payment not found');
        }

        const payment = result.rows[0];
        const studentResult = await db.query("SELECT * FROM students WHERE id = $1", [payment.student_id]);
        
        res.render('payments/edit', { 
            title: 'Edit Payment', 
            payment, 
            student: studentResult.rows[0], 
            user: req.session.user 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update payment
router.post('/:id/edit', isStaff, async (req, res) => {
    try {
        const { amount, payment_type, comments } = req.body;

        const paymentResult = await db.query("SELECT student_id FROM payments WHERE id = $1", [req.params.id]);
        
        if (paymentResult.rows.length === 0) {
            return res.status(404).send('Payment not found');
        }

        const studentId = paymentResult.rows[0].student_id;

        await db.query(
            `UPDATE payments SET amount=$1, payment_type=$2, comments=$3 WHERE id=$4`,
            [amount, payment_type, comments, req.params.id]
        );
        
        res.redirect(`/payments/student/${studentId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating payment');
    }
});

// View payment history for a student
router.get('/student/:id', isStaff, async (req, res) => {
    try {
        const studentId = req.params.id;

        const studentResult = await db.query("SELECT * FROM students WHERE id = $1", [studentId]);
        
        if (studentResult.rows.length === 0) {
            return res.status(404).send('Student not found');
        }

        const paymentsResult = await db.query("SELECT * FROM payments WHERE student_id = $1 ORDER BY payment_date DESC", [studentId]);

        res.render('payments/history', { 
            title: 'Payment History', 
            student: studentResult.rows[0], 
            payments: paymentsResult.rows, 
            user: req.session.user 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete payment
router.post('/:id/delete', isStaff, async (req, res) => {
    try {
        // Get payment to find student_id for redirect
        const result = await db.query("SELECT student_id FROM payments WHERE id = $1", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('Payment not found');
        }

        const studentId = result.rows[0].student_id;

        await db.query("DELETE FROM payments WHERE id = $1", [req.params.id]);
        res.redirect(`/payments/student/${studentId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting payment');
    }
});

module.exports = router;
