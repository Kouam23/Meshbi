const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const { router: authRouter } = require('./src/routes/auth');
const studentsRouter = require('./src/routes/students');
const subjectsRouter = require('./src/routes/subjects');
const teacherRouter = require('./src/routes/teacher');
const paymentsRouter = require('./src/routes/payments');
const reportsRouter = require('./src/routes/reports');
const i18n = require('./src/middleware/i18n');
const usersRouter = require('./src/routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
    store: new SQLiteStore({ db: 'sessions.db', dir: './' }),
    secret: 'meshbi_secret_key_change_me_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

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
    res.render('login', { title: 'Login', error: null });
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
