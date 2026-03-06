import express from "express";
import mysql from "mysql2";

const router = express.Router();

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "jesus@2005",
  database: "secureexamai",
  port:3306
});


// REGISTER
router.post("/register", (req, res) => {

  const { name, email, password } = req.body;

  const sql = "INSERT INTO students (name,email,password) VALUES (?,?,?)";

  db.query(sql,[name,email,password],(err,result)=>{
      if(err){
        res.send(err);
      }else{
        res.send("Student Registered Successfully");
      }
  })

});


// LOGIN
router.post("/login",(req,res)=>{

  const {email,password} = req.body;

  const sql = "SELECT * FROM students WHERE email=? AND password=?";

  db.query(sql,[email,password],(err,result)=>{
      if(err){
        res.send(err);
      }
      else{
        if(result.length>0){
            res.send("Login Success");
        }else{
            res.send("Invalid Credentials");
        }
      }
  })

});

export default router;