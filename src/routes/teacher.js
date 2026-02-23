const express = require('express');
const router = express.Router();
const db = require('../database');
const { isTeacher } = require('./auth');

// Teacher Dashboard - List assigned subjects
router.get('/', isTeacher, (req, res) => {
    const userId = req.session.user.id;

    db.all("SELECT * FROM subjects WHERE teacher_id = ? ORDER BY level, name", [userId], (err, subjects) => {
        if (err) return res.status(500).send('Server Error');
        res.render('teacher/dashboard', { title: 'Teacher Dashboard', subjects, user: req.session.user });
    });
});

// View students and grades for a subject
router.get('/subject/:id', isTeacher, (req, res) => {
    const subjectId = req.params.id;
    const userId = req.session.user.id;

    db.get("SELECT * FROM subjects WHERE id = ? AND teacher_id = ?", [subjectId, userId], (err, subject) => {
        if (err || !subject) return res.status(403).send('Forbidden or Subject Not Found');

        const { semester, sequence } = req.query;
        const currentSemester = semester ? parseInt(semester) : 1;
        const currentSequence = sequence ? parseInt(sequence) : 1;

        const sql = `
            SELECT s.*, g.grade 
            FROM students s 
            LEFT JOIN grades g ON s.id = g.student_id AND g.subject_id = ? AND g.semester = ? AND g.sequence = ?
            WHERE s.level = ? 
            ORDER BY s.name
        `;

        db.all(sql, [subjectId, currentSemester, currentSequence, subject.level], (err, students) => {
            if (err) return res.status(500).send('Server Error');

            res.render('teacher/subject_grades', {
                title: `Grades - ${subject.name}`,
                subject,
                students,
                user: req.session.user,
                filters: { semester: currentSemester, sequence: currentSequence }
            });
        });
    });
});

// Save grades (using db.prepare + transaction — valid for synchronous batch inserts)
router.post('/grades', isTeacher, (req, res) => {
    const { subject_id, semester, sequence, grades } = req.body;

    const stmt = db.prepare(`
        INSERT INTO grades (student_id, subject_id, semester, sequence, grade)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(student_id, subject_id, semester, sequence) 
        DO UPDATE SET grade = excluded.grade, created_at = CURRENT_TIMESTAMP
    `);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        for (const [studentId, gradeVal] of Object.entries(grades)) {
            if (gradeVal !== '') {
                stmt.run(studentId, subject_id, semester, sequence, gradeVal, (err) => {
                    if (err) console.error(`Error saving grade for student ${studentId}:`, err);
                });
            }
        }

        db.run("COMMIT", (err) => {
            if (err) return res.status(500).send("Error saving grades");
            stmt.finalize();
            res.redirect(`/teacher/subject/${subject_id}?semester=${semester}&sequence=${sequence}`);
        });
    });
});

module.exports = router;
