const path = require("path");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config({
    path: path.join(__dirname, "..", ".env")
});

const db = require("../config/db");

const STUDENT_DEMO_PASSWORD = "Student@123";

async function main() {
    const passwordHash = await bcrypt.hash(STUDENT_DEMO_PASSWORD, 10);

    db.query(
        "UPDATE users SET password = ? WHERE role = 'student'",
        [passwordHash],
        (updateErr, result) => {
            if (updateErr) {
                console.error(updateErr.message);
                db.end();
                process.exit(1);
                return;
            }

            db.query(
                "SELECT role, COUNT(1) AS total FROM users GROUP BY role",
                (countErr, rows) => {
                    if (countErr) {
                        console.error(countErr.message);
                        db.end();
                        process.exit(1);
                        return;
                    }

                    console.log(`updated_students=${result.affectedRows}`);
                    console.log(JSON.stringify(rows));
                    db.end();
                }
            );
        }
    );
}

main().catch((error) => {
    console.error(error.message);
    db.end();
    process.exit(1);
});
