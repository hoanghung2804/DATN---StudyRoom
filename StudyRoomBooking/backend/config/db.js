const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "study_room_booking",
    port: Number(process.env.DB_PORT || 3306)
});

connection.connect((err) => {
    if (err) {
        console.log(err);
        return;
    }

    console.log("MySQL Connected Successfully!");
});

module.exports = connection;
