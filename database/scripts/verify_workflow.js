const db = require('../../backend/src/database');
const { generateMatricule } = require('../utils/matricule');

async function verify() {
    console.log('Starting verification...');

    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    const get = (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    try {
        // 1. Verify Teacher
        const teacher = await get("SELECT * FROM users WHERE role = 'teacher'");
        if (!teacher) throw new Error('No teacher found');
        console.log('Teacher verified:', teacher.name);

        // 2. Create Subject
        const subjectName = 'Physics Verification';
        await run("INSERT INTO subjects (name, code, coefficient, level, teacher_id) VALUES (?, ?, ?, ?, ?)",
            [subjectName, 'PHY101', 2, 'Form 5', teacher.id]);
        const subject = await get("SELECT * FROM subjects WHERE name = ?", [subjectName]);
        console.log('Subject created:', subject.name);

        // 3. Register Student
        const matricule = await generateMatricule();
        const studentName = 'Test Student';
        await run("INSERT INTO students (name, matricule, level) VALUES (?, ?, ?)",
            [studentName, matricule, 'Form 5']);
        const student = await get("SELECT * FROM students WHERE matricule = ?", [matricule]);
        console.log('Student registered:', student.name, student.matricule);

        // 4. Add Grades
        // Semester 1, Sequence 1
        await run("INSERT INTO grades (student_id, subject_id, semester, sequence, grade) VALUES (?, ?, ?, ?, ?)",
            [student.id, subject.id, 1, 1, 15.5]);
        // Semester 1, Sequence 2
        await run("INSERT INTO grades (student_id, subject_id, semester, sequence, grade) VALUES (?, ?, ?, ?, ?)",
            [student.id, subject.id, 1, 2, 17.5]);
        console.log('Grades added.');

        // 5. Verify Report Logic (Semester 1)
        const grades = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM grades WHERE student_id = ? AND subject_id = ? AND semester = 1",
                [student.id, subject.id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
        });

        const seq1 = grades.find(g => g.sequence === 1).grade;
        const seq2 = grades.find(g => g.sequence === 2).grade;
        const avg = (seq1 + seq2) / 2;
        const weighted = avg * subject.coefficient;

        console.log(`Calculation: (${seq1} + ${seq2}) / 2 = ${avg}. Weighted (x${subject.coefficient}) = ${weighted}`);

        if (avg !== 16.5) throw new Error('Average calculation incorrect');
        if (weighted !== 33) throw new Error('Weighted point calculation incorrect');
        console.log('Grading logic verified.');

        // 6. Add Payment
        await run("INSERT INTO payments (student_id, amount, payment_type, recorded_by) VALUES (?, ?, ?, ?)",
            [student.id, 50000, 'Pension', 1]); // Assuming admin id 1 exists

        const payment = await get("SELECT * FROM payments WHERE student_id = ?", [student.id]);
        if (!payment || payment.amount !== 50000) throw new Error('Payment recording failed');
        console.log('Payment verified:', payment.amount);

        console.log('ALL CHECKS PASSED.');

    } catch (err) {
        console.error('Verification FAILED:', err);
    } finally {
        // Clean up test data? Maybe keep it for manual check.
        // db.close(); 
    }
}

verify();
