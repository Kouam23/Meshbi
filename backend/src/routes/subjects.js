const express = require('express');
const router = express.Router();
const db = require('../database');
const { isAdmin } = require('./auth');

// List all subjects
router.get('/', isAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT s.*, u.name as teacher_name 
            FROM subjects s 
            LEFT JOIN users u ON s.teacher_id = u.id 
            ORDER BY s.level, s.name
        `;
        const result = await db.query(sql);
        res.render('admin/subjects/list', { title: 'Manage Subjects', subjects: result.rows, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add subject form
router.get('/add', isAdmin, async (req, res) => {
    try {
        // Include users who are teachers either as primary or secondary role
        const result = await db.query("SELECT id, name FROM users WHERE role = 'teacher' OR secondary_role = 'teacher' ORDER BY name");
        res.render('admin/subjects/add', { title: 'Add Subject', teachers: result.rows, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add subject POST
router.post('/add', isAdmin, async (req, res) => {
    try {
        const { name, code, coefficient, level, teacher_id } = req.body;
        const teacher = teacher_id || null;

        await db.query(
            `INSERT INTO subjects (name, code, coefficient, level, teacher_id) VALUES ($1, $2, $3, $4, $5)`,
            [name, code, coefficient || 1, level, teacher]
        );
        res.redirect('/subjects');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding subject: ' + err.message);
    }
});

// Edit subject form
router.get('/:id/edit', isAdmin, async (req, res) => {
    try {
        const subjectResult = await db.query("SELECT * FROM subjects WHERE id = $1", [req.params.id]);
        
        if (subjectResult.rows.length === 0) {
            return res.status(404).send('Subject not found');
        }

        const teachersResult = await db.query("SELECT id, name FROM users WHERE role = 'teacher' OR secondary_role = 'teacher' ORDER BY name");
        
        res.render('admin/subjects/edit', { 
            title: 'Edit Subject', 
            subject: subjectResult.rows[0], 
            teachers: teachersResult.rows, 
            user: req.session.user 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update subject
router.post('/:id/edit', isAdmin, async (req, res) => {
    try {
        const { name, code, coefficient, level, teacher_id } = req.body;
        const teacher = teacher_id || null;

        await db.query(
            `UPDATE subjects SET name=$1, code=$2, coefficient=$3, level=$4, teacher_id=$5 WHERE id=$6`,
            [name, code, coefficient || 1, level, teacher, req.params.id]
        );
        
        res.redirect('/subjects');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating subject');
    }
});

// Delete subject
router.post('/:id/delete', isAdmin, async (req, res) => {
    try {
        await db.query("DELETE FROM subjects WHERE id = $1", [req.params.id]);
        res.redirect('/subjects');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting subject');
    }
});

module.exports = router;
