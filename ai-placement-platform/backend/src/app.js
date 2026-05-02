const express=require("express");
const cors=require("cors");

const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const practiceRoutes = require("./routes/practiceRoutes");
const communityRoutes = require("./routes/communityRoutes");
const app=express();

app.use(cors());
app.use(express.json());

// 📝 Global Request Logger
app.use((req, res, next) => {
  console.log(`API HIT: ${req.method} ${req.path}`, req.body || "");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/",(req,res)=>{
    res.send("API running...");
});

// ❌ Global Error Handler
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.stack);
  res.status(500).json({
    error: "Something went wrong",
    message: err.message,
    fallback: true
  });
});

module.exports=app;