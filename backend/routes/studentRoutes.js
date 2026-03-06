import express from "express";
import db from "../db.js";

const router = express.Router();

// REGISTER STUDENT
router.post("/register", (req, res) => {
    const { name, email, password, college } = req.body;

    const sql = "INSERT INTO students (name,email,password,college) VALUES (?,?,?,?)";

    db.query(sql, [name, email, password, college], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json({
            message: "Student registered successfully"
        });
    });
});


// LOGIN STUDENT
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM students WHERE email=? AND password=?";

    db.query(sql, [email, password], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        if (result.length === 0) {
            return res.json({
                message: "Invalid email or password"
            });
        }

        res.json({
            message: "Login successful",
            student: result[0]
        });
    });
});

export default router;