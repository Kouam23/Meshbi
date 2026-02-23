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
router.get('/search', isStaff, (req, res) => {
    const query = req.query.q || '';

    if (!query || query.length < 2) {
        return res.render('payments/search', { 
            title: 'Search Student for Payment', 
            students: [], 
            query,
            user: req.session.user
        });
    }

    // Search by name or matricule
    db.all(
        "SELECT * FROM students WHERE name LIKE ? OR matricule LIKE ? ORDER BY name LIMIT 20",
        [`%${query}%`, `%${query}%`],
        (err, students) => {
            if (err) return res.status(500).send('Server Error');
            res.render('payments/search', { 
                title: 'Search Student for Payment', 
                students, 
                query,
                user: req.session.user
            });
        }
    );
});

// Show add payment form
router.get('/add', isStaff, (req, res) => {
    const studentId = req.query.student_id;

    if (!studentId) {
        return res.redirect('/payments/search');
    }

    db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
        if (err || !student) return res.status(404).send('Student not found');

        res.render('payments/add', { title: 'Record Payment', student, user: req.session.user });
    });
});

// Record payment
router.post('/add', isStaff, (req, res) => {
    const { student_id, amount, payment_type, comments } = req.body;
    const recorded_by = req.session.user.id;

    const stmt = db.prepare(`
        INSERT INTO payments (student_id, amount, payment_type, comments, recorded_by)
        VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(student_id, amount, payment_type, comments, recorded_by, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error recording payment');
        }
        res.redirect(`/payments/student/${student_id}`);
    });
});

// View payment history for a student
router.get('/student/:id', isStaff, (req, res) => {
    const studentId = req.params.id;

    db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
        if (err || !student) return res.status(404).send('Student not found');

        db.all("SELECT * FROM payments WHERE student_id = ? ORDER BY payment_date DESC", [studentId], (err, payments) => {
            if (err) return res.status(500).send('Server Error');

            res.render('payments/history', { title: 'Payment History', student, payments, user: req.session.user });
        });
    });
});

module.exports = router;
