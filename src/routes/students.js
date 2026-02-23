const express = require('express');
const router = express.Router();
const db = require('../database');
const { generateMatricule } = require('../utils/matricule');
const { isAuthenticated, isAdmin, isSecretary, userHasRole } = require('./auth');

// Staff = admin OR secretary (either primary or secondary role)
function isStaff(req, res, next) {
    const u = req.session.user;
    if (u && (userHasRole(u, 'admin') || userHasRole(u, 'secretary'))) return next();
    res.status(403).send('Forbidden');
}

// Get all students
router.get('/', isAuthenticated, (req, res) => {
    db.all("SELECT * FROM students ORDER BY name", [], (err, students) => {
        if (err) return res.status(500).send('Server Error');
        res.render('students/list', {
            title: 'Students List',
            students,
            user: req.session.user
        });
    });
});

// Show add student form
router.get('/add', isStaff, (req, res) => {
    res.render('students/add', { title: 'Register New Student', user: req.session.user });
});

// Add new student
router.post('/add', isStaff, async (req, res) => {
    const { name, phone, level, dob, pob, gender, parent_name, parent_phone, address } = req.body;

    try {
        const matricule = await generateMatricule();

        db.run(
            `INSERT INTO students (name, phone, matricule, level, dob, pob, gender, parent_name, parent_phone, address)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, phone || null, matricule, level, dob || null, pob || null, gender || null, parent_name || null, parent_phone || null, address || null],
            function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error adding student: ' + err.message);
                }
                res.redirect('/students');
            }
        );
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// View student details
router.get('/:id', isAuthenticated, (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM students WHERE id = ?", [id], (err, student) => {
        if (err || !student) return res.status(404).send('Student not found');
        db.all("SELECT * FROM payments WHERE student_id = ? ORDER BY payment_date DESC", [id], (err2, payments) => {
            const totalPaid = payments ? payments.reduce((sum, p) => sum + p.amount, 0) : 0;
            res.render('students/view', {
                title: student.name,
                student,
                payments: payments || [],
                totalPaid,
                user: req.session.user
            });
        });
    });
});

// Edit student form
router.get('/:id/edit', isStaff, (req, res) => {
    db.get("SELECT * FROM students WHERE id = ?", [req.params.id], (err, student) => {
        if (err || !student) return res.status(404).send('Student not found');
        res.render('students/edit', { title: 'Edit Student', student, user: req.session.user });
    });
});

// Update student
router.post('/:id/edit', isStaff, (req, res) => {
    const { name, phone, level, dob, pob, gender, parent_name, parent_phone, address } = req.body;
    db.run(
        `UPDATE students SET name=?, phone=?, level=?, dob=?, pob=?, gender=?, parent_name=?, parent_phone=?, address=? WHERE id=?`,
        [name, phone, level, dob, pob, gender, parent_name, parent_phone, address, req.params.id],
        (err) => {
            if (err) return res.status(500).send('Error updating student');
            res.redirect('/students/' + req.params.id);
        }
    );
});

module.exports = router;
