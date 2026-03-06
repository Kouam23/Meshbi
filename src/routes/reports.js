const express = require('express');
const router = express.Router();
const db = require('../database');

// Middleware to check if user is admin
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Forbidden');
}

// Reports Dashboard
router.get('/', isAdmin, async (req, res) => {
    try {
        // Get distinct levels
        const result = await db.query("SELECT DISTINCT level FROM students ORDER BY level");
        res.render('admin/reports/dashboard', { title: 'Reports', levels: result.rows, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Generate Bulletin
router.get('/bulletin', isAdmin, async (req, res) => {
    try {
        const { level, student_id, semester, type } = req.query; // type can be 'semester' or 'annual'

        if (type === 'annual') {
            // Handle annual average calculation
            return generateAnnualBulletin(req, res, student_id);
        }

        const currentSemester = parseInt(semester) || 1;

        // 1. Get Student
        const studentResult = await db.query("SELECT * FROM students WHERE id = $1", [student_id]);
        
        if (studentResult.rows.length === 0) {
            return res.status(404).send('Student not found');
        }
        
        const student = studentResult.rows[0];

        // 2. Get Subjects and Grades
        const sql = `
            SELECT s.name, s.code, s.coefficient, 
                   MAX(CASE WHEN g.sequence = 1 THEN g.grade ELSE NULL END) as seq1,
                   MAX(CASE WHEN g.sequence = 2 THEN g.grade ELSE NULL END) as seq2,
                   u.name as teacher_name
            FROM subjects s
            LEFT JOIN grades g ON s.id = g.subject_id AND g.student_id = $1 AND g.semester = $2
            LEFT JOIN users u ON s.teacher_id = u.id
            WHERE s.level = $3
            GROUP BY s.id, s.name, s.code, s.coefficient, u.name
        `;

        const gradesResult = await db.query(sql, [student_id, currentSemester, student.level]);
        const rows = gradesResult.rows;

        let totalCoeff = 0;
        let totalPoints = 0;

        const results = rows.map(row => {
            const seq1 = row.seq1 !== null ? row.seq1 : 0;
            const seq2 = row.seq2 !== null ? row.seq2 : 0;

            const subjectAvg = (seq1 + seq2) / 2;
            const weightedPoint = subjectAvg * row.coefficient;

            totalCoeff += row.coefficient;
            totalPoints += weightedPoint;

            return {
                ...row,
                seq1,
                seq2,
                subjectAvg,
                weightedPoint
            };
        });

        const semesterAvg = totalCoeff > 0 ? (totalPoints / totalCoeff) : 0;

        res.render('admin/reports/bulletin', {
            title: 'Bulletin',
            student,
            semester: currentSemester,
            results,
            summary: { totalPoints, totalCoeff, semesterAvg },
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database Error');
    }
});

// Helper for Annual Bulletin
async function generateAnnualBulletin(req, res, studentId) {
    try {
        const studentResult = await db.query("SELECT * FROM students WHERE id = $1", [studentId]);
        
        if (studentResult.rows.length === 0) {
            return res.status(404).send('Student not found');
        }
        
        const student = studentResult.rows[0];

        const getSemesterData = async (sem) => {
            const sql = `
                SELECT s.coefficient, g.grade, g.sequence
                FROM subjects s
                JOIN grades g ON s.id = g.subject_id
                WHERE g.student_id = $1 AND g.semester = $2 AND s.level = $3
            `;
            const result = await db.query(sql, [studentId, sem, student.level]);
            return result.rows;
        };

        const [sem1, sem2, sem3] = await Promise.all([
            getSemesterData(1),
            getSemesterData(2),
            getSemesterData(3)
        ]);

        // For MVP, let's just render the Semester Bulletin correctly first
        res.send("Annual Report Logic is complex, please use Semester reports for now.");
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}

// API to get students by level for dropdowns
router.get('/api/students/:level', isAdmin, async (req, res) => {
    try {
        const result = await db.query("SELECT id, name, matricule FROM students WHERE level = $1 ORDER BY name", [req.params.level]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error' });
    }
});

module.exports = router;
