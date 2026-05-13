const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const protect = require("../middlewares/authMiddleware");

router.get("/leaderboard", protect, communityController.getLeaderboard);

router.get("/posts", protect, communityController.getPosts);
router.post("/post", protect, communityController.createPost);
router.post("/comment", protect, communityController.addComment);
router.post("/upvote", protect, communityController.upvotePost);

module.exports = router;
