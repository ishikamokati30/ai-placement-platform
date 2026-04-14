const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");

const {
  startInterview,
  submitAnswer,
} = require("../controllers/interviewController");

router.post("/start", protect, startInterview);
router.post("/answer", protect, submitAnswer);

module.exports = router;