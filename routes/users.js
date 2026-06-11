const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async(req,res)=>{

    const result =
    await pool.query(
        "SELECT * FROM users"
    );

    res.json(result.rows);

});

module.exports = router;

router.post("/register", async(req,res)=>{

    const {
        username,
        password_hash
    } = req.body;

    const result =
    await pool.query(
        `
        INSERT INTO users
        (username,password_hash)
        VALUES($1,$2)
        RETURNING *
        `,
        [username,password_hash]
    );

    res.json(result.rows[0]);

});