const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "hung2000",
    database: "study_room_booking",
    port: 3306
});

function createCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    return Array.from({ length: 6 }, () =>
        alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join("");
}

db.query(
    `
        SELECT id
        FROM bookings
        WHERE status = 'approved'
        AND (
            checkin_code IS NULL
            OR checkin_code = ''
        )
    `,
    (err, rows) => {
        if (err) {
            console.error(err.message);
            db.end();
            process.exit(1);
            return;
        }

        if (rows.length === 0) {
            console.log("No approved bookings need check-in codes");
            db.end();
            return;
        }

        let remaining = rows.length;

        rows.forEach((row) => {
            db.query(
                "UPDATE bookings SET checkin_code = ? WHERE id = ?",
                [createCode(), row.id],
                (updateErr) => {
                    if (updateErr) {
                        console.error(updateErr.message);
                        process.exitCode = 1;
                    }

                    remaining -= 1;

                    if (remaining === 0) {
                        console.log(
                            `Updated check-in codes for ${rows.length} approved bookings`
                        );
                        db.end();
                    }
                }
            );
        });
    }
);
