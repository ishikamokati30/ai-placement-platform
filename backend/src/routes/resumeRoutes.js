const express = require("express");
const router = express.Router();
const multer = require("multer");
const protect = require("../middlewares/authMiddleware");
const { analyzeResume } = require("../controllers/resumeController");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/analyze", protect, upload.single("resume"), analyzeResume);

module.exports = router;
