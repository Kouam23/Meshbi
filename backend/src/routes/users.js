const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') return next();
    res.status(403).send('Forbidden');
}

// List all users
router.get('/', isAdmin, async (req, res) => {
    try {
        const result = await db.query("SELECT id, name, email, role, created_at FROM users ORDER BY role, name");
        res.render('admin/users/list', { title: 'Manage Users', users: result.rows, user: req.session.user, success: req.query.success });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
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
        // Check if email already exists
        const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);

        if (existing.rows.length > 0) {
            return res.render('admin/users/add', { title: 'Add User', user: req.session.user, error: 'Email already in use.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        await db.query(
            "INSERT INTO users (name, email, password, role, secondary_role) VALUES ($1, $2, $3, $4, $5)",
            [name, email, hashed, role, null]
        );
        res.redirect('/users?success=User created successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Edit user form
router.get('/:id/edit', isAdmin, async (req, res) => {
    try {
        const result = await db.query("SELECT id, name, email, role, secondary_role FROM users WHERE id = $1", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('User not found');
        }
        
        res.render('admin/users/edit', { title: 'Edit User', user_data: result.rows[0], user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update user
router.post('/:id/edit', isAdmin, async (req, res) => {
    try {
        const { name, email, password, role, secondary_role } = req.body;
        const userId = req.params.id;

        // Check if email is already taken by another user
        const existing = await db.query("SELECT id FROM users WHERE email = $1 AND id != $2", [email, userId]);
        
        if (existing.rows.length > 0) {
            const userResult = await db.query("SELECT id, name, email, role, secondary_role FROM users WHERE id = $1", [userId]);
            return res.render('admin/users/edit', { 
                title: 'Edit User', 
                user_data: userResult.rows[0],
                user: req.session.user, 
                error: 'Email already in use.' 
            });
        }

        // If password is provided, hash it; otherwise keep the old one
        if (password && password.trim()) {
            const hashed = await bcrypt.hash(password, 10);
            await db.query(
                "UPDATE users SET name=$1, email=$2, password=$3, role=$4, secondary_role=$5 WHERE id=$6",
                [name, email, hashed, role, secondary_role || null, userId]
            );
        } else {
            await db.query(
                "UPDATE users SET name=$1, email=$2, role=$3, secondary_role=$4 WHERE id=$5",
                [name, email, role, secondary_role || null, userId]
            );
        }
        
        res.redirect('/users?success=User updated successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating user');
    }
});

// Delete user
router.post('/:id/delete', isAdmin, async (req, res) => {
    try {
        // Prevent self-deletion
        if (parseInt(req.params.id) === req.session.user.id) {
            return res.redirect('/users');
        }
        await db.query("DELETE FROM users WHERE id = $1", [req.params.id]);
        res.redirect('/users');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
});

module.exports = router;
