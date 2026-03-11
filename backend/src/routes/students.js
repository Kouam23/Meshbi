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
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM students ORDER BY name");
        res.render('students/list', {
            title: 'Students List',
            students: result.rows,
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
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
        
        // Convert empty strings to NULL for optional fields
        const dobValue = dob && dob.trim() ? dob : null;

        await db.query(
            `INSERT INTO students (name, phone, matricule, level, dob, pob, gender, parent_name, parent_phone, address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [name, phone || null, matricule, level, dobValue, pob || null, gender || null, parent_name || null, parent_phone || null, address || null]
        );
        
        res.redirect('/students');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// View student details
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        const studentResult = await db.query("SELECT * FROM students WHERE id = $1", [id]);
        
        if (studentResult.rows.length === 0) {
            return res.status(404).send('Student not found');
        }
        
        const student = studentResult.rows[0];
        const paymentsResult = await db.query("SELECT * FROM payments WHERE student_id = $1 ORDER BY payment_date DESC", [id]);
        const payments = paymentsResult.rows;
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        
        res.render('students/view', {
            title: student.name,
            student,
            payments,
            totalPaid,
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Edit student form
router.get('/:id/edit', isStaff, async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM students WHERE id = $1", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('Student not found');
        }
        
        res.render('students/edit', { title: 'Edit Student', student: result.rows[0], user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update student
router.post('/:id/edit', isStaff, async (req, res) => {
    try {
        const { name, phone, level, dob, pob, gender, parent_name, parent_phone, address } = req.body;
        
        // Convert empty strings to NULL for date fields
        const dobValue = dob && dob.trim() ? dob : null;
        
        await db.query(
            `UPDATE students SET name=$1, phone=$2, level=$3, dob=$4, pob=$5, gender=$6, parent_name=$7, parent_phone=$8, address=$9 WHERE id=$10`,
            [name, phone || null, level, dobValue, pob || null, gender || null, parent_name || null, parent_phone || null, address || null, req.params.id]
        );
        
        res.redirect('/students/' + req.params.id);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating student');
    }
});

// Delete student
router.post('/:id/delete', isStaff, async (req, res) => {
    try {
        await db.query("DELETE FROM students WHERE id = $1", [req.params.id]);
        res.redirect('/students');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting student');
    }
});

module.exports = router;
