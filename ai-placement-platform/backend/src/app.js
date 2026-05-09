const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const practiceRoutes = require("./routes/practiceRoutes");
const communityRoutes = require("./routes/communityRoutes");

const app = express();

// 🌐 CORS Configuration
app.use(cors({
  origin: "*", // Allow all for now, but can be restricted to Vercel URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 📝 Global Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 🚀 Routes
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "ElevateAI API is running" });
});

// ❌ Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ GLOBAL ERROR:", {
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Internal Server Error",
    path: req.path
  });
});

module.exports = app;