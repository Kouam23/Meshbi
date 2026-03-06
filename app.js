const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./src/database');
const { router: authRouter } = require('./src/routes/auth');
const studentsRouter = require('./src/routes/students');
const subjectsRouter = require('./src/routes/subjects');
const teacherRouter = require('./src/routes/teacher');
const paymentsRouter = require('./src/routes/payments');
const reportsRouter = require('./src/routes/reports');
const i18n = require('./src/middleware/i18n');
const usersRouter = require('./src/routes/users');
const auditRouter = require('./src/routes/audit');
const { auditMiddleware } = require('./src/utils/audit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session setup with inactivity timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 25 * 60 * 1000;   // Show warning at 25 minutes

app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: 'meshbi_secret_key_change_me_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: SESSION_TIMEOUT,
        httpOnly: true,
        secure: false // Set to true if using HTTPS
    }
}));

// Audit logging middleware
app.use(auditMiddleware);

// Session timeout middleware
app.use((req, res, next) => {
    if (req.session.user) {
        const now = Date.now();
        const lastActivity = req.session.lastActivity || now;
        const timeSinceLastActivity = now - lastActivity;

        // If inactivity exceeds timeout, destroy session
        if (timeSinceLastActivity > SESSION_TIMEOUT) {
            req.session.destroy();
            return res.redirect('/login?timeout=true');
        }

        // Update last activity time
        req.session.lastActivity = now;

        // Check if warning should be shown
        if (timeSinceLastActivity > WARNING_TIME) {
            res.locals.showSessionWarning = true;
            res.locals.sessionTimeoutMs = SESSION_TIMEOUT - timeSinceLastActivity;
        }
    }
    next();
});

// i18n – must be after session
app.use(i18n);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Language switcher
app.get('/lang/:code', (req, res) => {
    const code = req.params.code;
    if (['en', 'fr'].includes(code)) {
        req.session.lang = code;
    }
    const referer = req.get('Referer') || '/';
    res.redirect(referer);
});

// Routes
app.use('/auth', authRouter);
app.use('/students', studentsRouter);
app.use('/subjects', subjectsRouter);
app.use('/teacher', teacherRouter);
app.use('/payments', paymentsRouter);
app.use('/reports', reportsRouter);
app.use('/users', usersRouter);
app.use('/audit', auditRouter);

// Root
app.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') return res.redirect('/admin');
        if (req.session.user.role === 'teacher') return res.redirect('/teacher');
        if (req.session.user.role === 'secretary') return res.redirect('/secretary');
    }
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('login', { title: 'Login', error: null, query: req.query });
});

// Role dashboards
app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    res.render('admin/dashboard', { title: 'Admin Dashboard', user: req.session.user });
});

app.get('/secretary', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'secretary') return res.redirect('/login');
    res.render('secretary/dashboard', { title: 'Secretary Dashboard', user: req.session.user });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
