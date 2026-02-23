const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') return next();
    res.status(403).send('Forbidden');
}

// List all users
router.get('/', isAdmin, (req, res) => {
    db.all("SELECT id, name, email, role, created_at FROM users ORDER BY role, name", [], (err, users) => {
        if (err) return res.status(500).send('Server Error');
        res.render('admin/users/list', { title: 'Manage Users', users, user: req.session.user, success: req.query.success });
    });
});

// Add user form
router.get('/add', isAdmin, (req, res) => {
    res.render('admin/users/add', { title: 'Add User', user: req.session.user, error: null });
});

// Add user POST
router.post('/add', isAdmin, async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.render('admin/users/add', { title: 'Add User', user: req.session.user, error: 'All fields are required.' });
    }

    try {
        const existing = await new Promise((resolve, reject) => {
            db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => err ? reject(err) : resolve(row));
        });

        if (existing) {
            return res.render('admin/users/add', { title: 'Add User', user: req.session.user, error: 'Email already in use.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        db.run(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashed, role],
            function (err) {
                if (err) return res.status(500).send('Error creating user: ' + err.message);
                res.redirect('/users?success=User created successfully');
            }
        );
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete user
router.post('/:id/delete', isAdmin, (req, res) => {
    // Prevent self-deletion
    if (parseInt(req.params.id) === req.session.user.id) {
        return res.redirect('/users');
    }
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).send('Error');
        res.redirect('/users');
    });
});

module.exports = router;
