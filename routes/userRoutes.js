const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

const ranks = [
  "Cabin Boy",
  "Deckhand",
  "Swordsman",
  "Commander",
  "Captain",
  "Warlord",
  "Yonko",
  "Pirate King"
];

function calculateRank(xp) {
  const level = Math.floor(xp / 100);
  return ranks[level] || "Pirate King";
}

// GET user profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE xp, streak, lessons after completing a lesson
router.post("/update-progress", protect, async (req, res) => {
  try {
    const { earnedXP } = req.body;

    const user = await User.findById(req.user._id);

    // XP update
    user.xp += earnedXP;
    user.bounty += earnedXP;
    user.lessonsCompleted += 1;
    user.rank = calculateRank(user.xp);

    // Streak update
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (user.lastStudyDate === today) {
      // already studied today, no streak change
    } else if (user.lastStudyDate === yesterday.toDateString()) {
      user.streak += 1;
    } else {
      user.streak = 1;
    }

    user.lastStudyDate = today;

    await user.save();

    res.json({
      xp: user.xp,
      bounty: user.bounty,
      streak: user.streak,
      rank: user.rank,
      lessonsCompleted: user.lessonsCompleted
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Claim daily treasure
router.post("/claim-treasure", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const today = new Date().toDateString();

    if (user.lastTreasureClaim === today) {
      return res.status(400).json({ message: "Already claimed today" });
    }

    const reward = Math.floor(Math.random() * 40) + 10;
    user.xp += reward;
    user.bounty += reward;
    user.lastTreasureClaim = today;
    user.rank = calculateRank(user.xp);

    await user.save();

    res.json({ reward, bounty: user.bounty, xp: user.xp });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;