const express = require('express');
const router = express.Router();
const db = require('../database');
const { isTeacher } = require('./auth');

// Teacher Dashboard - List assigned subjects
router.get('/', isTeacher, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const result = await db.query("SELECT * FROM subjects WHERE teacher_id = $1 ORDER BY level, name", [userId]);
        res.render('teacher/dashboard', { title: 'Teacher Dashboard', subjects: result.rows, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// View students and grades for a subject
router.get('/subject/:id', isTeacher, async (req, res) => {
    try {
        const subjectId = req.params.id;
        const userId = req.session.user.id;

        const subjectResult = await db.query("SELECT * FROM subjects WHERE id = $1 AND teacher_id = $2", [subjectId, userId]);
        
        if (subjectResult.rows.length === 0) {
            return res.status(403).send('Forbidden or Subject Not Found');
        }
        
        const subject = subjectResult.rows[0];
        const { semester, sequence } = req.query;
        const currentSemester = semester ? parseInt(semester) : 1;
        const currentSequence = sequence ? parseInt(sequence) : 1;

        const sql = `
            SELECT s.*, g.grade 
            FROM students s 
            LEFT JOIN grades g ON s.id = g.student_id AND g.subject_id = $1 AND g.semester = $2 AND g.sequence = $3
            WHERE s.level = $4 
            ORDER BY s.name
        `;

        const studentsResult = await db.query(sql, [subjectId, currentSemester, currentSequence, subject.level]);

        res.render('teacher/subject_grades', {
            title: `Grades - ${subject.name}`,
            subject,
            students: studentsResult.rows,
            user: req.session.user,
            filters: { semester: currentSemester, sequence: currentSequence },
            success: req.query.success
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Save grades using PostgreSQL upsert (INSERT ... ON CONFLICT)
router.post('/grades', isTeacher, async (req, res) => {
    try {
        const { subject_id, semester, sequence, grades } = req.body;
        const client = await db.connect();

        try {
            await client.query('BEGIN');

            // Handle grades - can be an object or array depending on form submission
            const gradesObj = grades || {};
            
            for (const [studentIdKey, gradeVal] of Object.entries(gradesObj)) {
                if (gradeVal !== '' && gradeVal !== null && gradeVal !== undefined) {
                    // studentIdKey should be just the numeric ID
                    const studentId = parseInt(studentIdKey, 10);
                    
                    // Only proceed if we have a valid student ID
                    if (!isNaN(studentId) && studentId > 0) {
                        const numericGrade = parseFloat(gradeVal);
                        
                        // Validate grade is between 0 and 20
                        if (!isNaN(numericGrade) && numericGrade >= 0 && numericGrade <= 20) {
                            await client.query(
                                `INSERT INTO grades (student_id, subject_id, semester, sequence, grade)
                                 VALUES ($1, $2, $3, $4, $5)
                                 ON CONFLICT(student_id, subject_id, semester, sequence) 
                                 DO UPDATE SET grade = $5, created_at = CURRENT_TIMESTAMP`,
                                [studentId, subject_id, semester, sequence, numericGrade]
                            );
                        }
                    }
                }
            }

            await client.query('COMMIT');
            res.redirect(`/teacher/subject/${subject_id}?semester=${semester}&sequence=${sequence}&success=grades_saved`);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Grade save error:', err);
        res.status(500).send('Error saving grades');
    }
});

module.exports = router;
