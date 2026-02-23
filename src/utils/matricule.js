const db = require('../database');

/**
 * Generates the next matricule in the format MBI5.XXXX.2026
 */
function generateMatricule() {
    return new Promise((resolve, reject) => {
        const year = '2026';
        const prefix = 'MBI5';

        // Get the last student created with this pattern
        db.get(
            "SELECT matricule FROM students WHERE matricule LIKE ? ORDER BY id DESC LIMIT 1",
            [`${prefix}.%.${year}`],
            (err, row) => {
                if (err) return reject(err);

                let sequence = 1;

                if (row) {
                    const parts = row.matricule.split('.');
                    if (parts.length === 3) {
                        const lastSeq = parseInt(parts[1], 10);
                        if (!isNaN(lastSeq)) {
                            sequence = lastSeq + 1;
                        }
                    }
                }

                const paddedSeq = sequence.toString().padStart(4, '0');
                resolve(`${prefix}.${paddedSeq}.${year}`);
            }
        );
    });
}

module.exports = { generateMatricule };
