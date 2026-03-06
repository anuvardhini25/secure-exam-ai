import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth",authRoutes);
pp.use("/students", studentRoutes);
app.use("/exams", examRoutes);

// MySQL Connection
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "jesus@2005",   // put your mysql password
  database: "secureexamai"
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

// Test API
app.get("/", (req, res) => {
  res.send("SecureExam AI Backend Running");
});

// Get Students API
app.get("/students", (req, res) => {
  const sql = "SELECT * FROM students";
  
  db.query(sql, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.json(result);
    }
  });
});

// Insert Student API
app.post("/students", (req, res) => {
  const { name, email } = req.body;

  const sql = "INSERT INTO students (name, email) VALUES (?, ?)";

  db.query(sql, [name, email], (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send("Student added successfully");
    }
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});