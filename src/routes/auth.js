const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Check if the session user has a specific role (primary OR secondary) */
function userHasRole(user, role) {
    if (!user) return false;
    return user.role === role || user.secondary_role === role;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}

function isAdmin(req, res, next) {
    if (req.session.user && userHasRole(req.session.user, 'admin')) return next();
    res.status(403).send('Forbidden');
}

function isTeacher(req, res, next) {
    if (req.session.user && userHasRole(req.session.user, 'teacher')) return next();
    res.status(403).send('Forbidden');
}

function isSecretary(req, res, next) {
    if (req.session.user && userHasRole(req.session.user, 'secretary')) return next();
    res.status(403).send('Forbidden');
}

/** Any logged-in staff member (admin, teacher, or secretary) */
function isStaff(req, res, next) {
    if (req.session.user) return next();
    res.status(403).send('Forbidden');
}

/** hasRole kept for backward compatibility */
function hasRole(role) {
    return (req, res, next) => {
        if (req.session.user && userHasRole(req.session.user, role)) return next();
        res.status(403).send('Forbidden');
    };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server Error');
        }

        if (user) {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                // Store both roles in session
                req.session.user = {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    secondary_role: user.secondary_role || null,
                };

                // Redirect to primary role dashboard
                if (user.role === 'admin') return res.redirect('/admin');
                if (user.role === 'secretary') return res.redirect('/secretary');
                if (user.role === 'teacher') return res.redirect('/teacher');

                return res.redirect('/');
            }
        }

        res.render('login', { title: 'Login', error: 'Invalid credentials' });
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = { router, isAuthenticated, isAdmin, isTeacher, isSecretary, isStaff, hasRole, userHasRole };
