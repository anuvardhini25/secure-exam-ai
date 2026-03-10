const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/results", (req, res) => {

  const sql = "SELECT * FROM exams_result";

  db.query(sql, (err, result) => {

    if (err) return res.json(err);

    res.json(result);

  });

});

module.exports = router;