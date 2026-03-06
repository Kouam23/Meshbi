const db = require('../database');

/**
 * Generates the next matricule in the format MBI5.XXXX.2026
 */
async function generateMatricule() {
    const year = '2026';
    const prefix = 'MBI5';

    // Get the last student created with this pattern using PostgreSQL pattern matching
    const result = await db.query(
        "SELECT matricule FROM students WHERE matricule LIKE $1 ORDER BY id DESC LIMIT 1",
        [`${prefix}.%.${year}`]
    );

    let sequence = 1;

    if (result && result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        if (row && row.matricule) {
            const parts = row.matricule.split('.');
            if (parts.length === 3) {
                const lastSeq = parseInt(parts[1], 10);
                if (!isNaN(lastSeq)) {
                    sequence = lastSeq + 1;
                }
            }
        }
    }

    const paddedSeq = sequence.toString().padStart(4, '0');
    return `${prefix}.${paddedSeq}.${year}`;
}

module.exports = { generateMatricule };
