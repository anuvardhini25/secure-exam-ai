const mysql = require("mysql2");



const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "jesus@2005",
  database: "secureexamai",
  port:3306
});

db.connect((err) => {
  if (err) {
    console.log("Database error", err);
  } else {
    console.log("MySQL Connected");
  }
});

module.exports = db;