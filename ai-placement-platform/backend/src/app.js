<<<<<<< HEAD
const express = require("express");
const cors = require("cors");
require("dotenv").config();
=======
const express=require("express");
const cors=require("cors");
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a

const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const practiceRoutes = require("./routes/practiceRoutes");
const communityRoutes = require("./routes/communityRoutes");
<<<<<<< HEAD

const app = express();

// 🌐 CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://elevateai-ai.vercel.app",
  "https://ai-placement-platform.vercel.app",
  process.env.FRONTEND_URL, // Allow frontend URL from env
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes("*")) {
        const regex = new RegExp("^" + allowedOrigin.replace(/\*/g, ".*") + "$");
        return regex.test(origin);
      }
      return allowedOrigin === origin || origin.endsWith(".vercel.app");
    });

    if (isAllowed || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

=======
const app=express();

app.use(cors());
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
app.use(express.json());

// 📝 Global Request Logger
app.use((req, res, next) => {
<<<<<<< HEAD
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 🚀 Routes
=======
  console.log(`API HIT: ${req.method} ${req.path}`, req.body || "");
  next();
});

>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/dashboard", dashboardRoutes);

<<<<<<< HEAD
// Task 8: Health check route
app.get("/", (req, res) => {
  res.status(200).json({ status: "Backend running" });
=======
app.get("/",(req,res)=>{
    res.send("API running...");
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
});

// ❌ Global Error Handler
app.use((err, req, res, next) => {
<<<<<<< HEAD
  const statusCode = err.status || 500;
  console.error(`❌ ERROR [${statusCode}]:`, {
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
    path: req.path,
    method: req.method,
    body: req.method !== 'GET' ? req.body : undefined
  });

  res.status(statusCode).json({
    error: true,
    message: err.message || "Internal Server Error",
    path: req.path,
    status: statusCode
  });
});

module.exports = app;
=======
  console.error("GLOBAL ERROR:", err.stack);
  res.status(500).json({
    error: "Something went wrong",
    message: err.message,
    fallback: true
  });
});

module.exports=app;
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
