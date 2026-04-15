const express=require("express");
const cors=require("cors");

const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const app=express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);

app.use("/api/dashboard", dashboardRoutes);
app.get("/",(req,res)=>{
    res.send("API running...");
});

module.exports=app;