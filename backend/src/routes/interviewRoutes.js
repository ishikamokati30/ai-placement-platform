const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");

const {
  startInterview,
  submitAnswer,
  getSetupSuggestions,
} = require("../controllers/interviewController");

router.post("/start", protect, startInterview);
router.post("/answer", protect, submitAnswer);
router.post("/submit", protect, submitAnswer);
router.post("/setup-suggestions", protect, getSetupSuggestions);

module.exports = router;
