const pool = require("./config/db");

pool.query(
    "SELECT NOW()",
    (err,result)=>{
        if(err){
            console.log(err);
        }
        else{
            console.log("Database Connected");
        }
    }
);

const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/users");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.send("Backend Running");
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});