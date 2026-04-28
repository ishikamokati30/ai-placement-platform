const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  getConcept,
  generateMCQs,
  evaluatePractice,
  chat,
} = require("../controllers/practiceController");

router.post("/concept", protect, getConcept);
router.post("/mcq", protect, generateMCQs);
router.post("/evaluate", protect, evaluatePractice);
router.post("/chat", protect, chat);

module.exports = router;
