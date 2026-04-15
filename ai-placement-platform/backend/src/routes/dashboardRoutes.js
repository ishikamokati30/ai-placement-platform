const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");

const {
  getDashboard,
  getProgress,
} = require("../controllers/dashboardController");

router.get("/", protect, getDashboard);
router.get("/progress", protect, getProgress);

module.exports = router;