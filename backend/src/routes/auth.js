const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');
const { logAction } = require('../utils/audit');

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

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

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

                // Log successful login
                logAction({
                    userId: user.id,
                    userName: user.name,
                    userRole: user.role,
                    action: 'LOGIN',
                    entityType: 'user',
                    entityId: user.id,
                    entityName: user.name,
                    ipAddress: req.auditLog.ipAddress
                });

                // Save session before redirecting
                return req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return res.status(500).send('Login error');
                    }
                    
                    // Redirect to primary role dashboard
                    if (user.role === 'admin') return res.redirect('/admin');
                    if (user.role === 'secretary') return res.redirect('/secretary');
                    if (user.role === 'teacher') return res.redirect('/teacher');

                    return res.redirect('/');
                });
            }
        }

        // Log failed login attempt
        logAction({
            userId: null,
            userName: email,
            userRole: 'unknown',
            action: 'LOGIN_FAILED',
            entityType: 'user',
            details: 'Invalid credentials',
            ipAddress: req.auditLog.ipAddress
        });

        res.render('login', { title: 'Login', error: 'Invalid credentials', query: req.query });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/refresh-session', (req, res) => {
    if (req.session.user) {
        // Update last activity time to extend session
        req.session.lastActivity = Date.now();
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Session refresh failed' });
            }
            res.json({ success: true });
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

router.get('/logout', (req, res) => {
    const user = req.session.user;
    
    // Log logout action
    if (user) {
        logAction({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action: 'LOGOUT',
            entityType: 'user',
            entityId: user.id,
            ipAddress: req.auditLog.ipAddress
        });
    }
    
    // Destroy session with callback to ensure it completes before redirecting
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error:', err);
            return res.status(500).send('Logout error');
        }
        res.redirect('/login');
    });
});

module.exports = { router, isAuthenticated, isAdmin, isTeacher, isSecretary, isStaff, hasRole, userHasRole };
