const express = require('express');
const router = express.Router();
const db = require('../database');
const { isAdmin } = require('./auth');

// List all subjects
router.get('/', isAdmin, (req, res) => {
    const sql = `
        SELECT s.*, u.name as teacher_name 
        FROM subjects s 
        LEFT JOIN users u ON s.teacher_id = u.id 
        ORDER BY s.level, s.name
    `;
    db.all(sql, [], (err, subjects) => {
        if (err) return res.status(500).send('Server Error');
        res.render('admin/subjects/list', { title: 'Manage Subjects', subjects, user: req.session.user });
    });
});

// Add subject form
router.get('/add', isAdmin, (req, res) => {
    // Include users who are teachers either as primary or secondary role
    db.all("SELECT id, name FROM users WHERE role = 'teacher' OR secondary_role = 'teacher' ORDER BY name", [], (err, teachers) => {
        if (err) return res.status(500).send('Server Error');
        res.render('admin/subjects/add', { title: 'Add Subject', teachers, user: req.session.user });
    });
});

// Add subject POST
router.post('/add', isAdmin, (req, res) => {
    const { name, code, coefficient, level, teacher_id } = req.body;
    const teacher = teacher_id || null;

    db.run(
        `INSERT INTO subjects (name, code, coefficient, level, teacher_id) VALUES (?, ?, ?, ?, ?)`,
        [name, code, coefficient || 1, level, teacher],
        function (err) {
            if (err) return res.status(500).send('Error adding subject: ' + err.message);
            res.redirect('/subjects');
        }
    );
});

// Delete subject
router.post('/:id/delete', isAdmin, (req, res) => {
    db.run("DELETE FROM subjects WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).send('Error deleting subject');
        res.redirect('/subjects');
    });
});

module.exports = router;
