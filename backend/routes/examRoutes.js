import express from "express";
import db from "../db.js";

const router = express.Router();


// GET ALL EXAMS
router.get("/all", (req, res) => {

    const sql = "SELECT * FROM exams";

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json(result);
    });

});


// START EXAM
router.post("/start", (req, res) => {

    const { student_id, exam_id } = req.body;

    const sql = "INSERT INTO results (student_id, exam_id, score, suspicion_score, risk_level) VALUES (?,?,?,?,?)";

    db.query(sql, [student_id, exam_id, 0, 0, "Low"], (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        res.json({
            message: "Exam started"
        });

    });

});


// SUBMIT EXAM
router.post("/submit", (req, res) => {

    const { student_id, exam_id, score, suspicion_score, risk_level } = req.body;

    const sql = "UPDATE results SET score=?, suspicion_score=?, risk_level=? WHERE student_id=? AND exam_id=?";

    db.query(sql, [score, suspicion_score, risk_level, student_id, exam_id], (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        res.json({
            message: "Exam submitted successfully"
        });

    });

});


export default router;