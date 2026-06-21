const express = require("express");
const router  = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const TeacherProfile = require("../models/TeacherProfile");

// GET /api/teacher/my-profile
// Returns the teacher's profile with assignments populated (classId, sectionId)
router.get("/my-profile", protect, requireRole("teacher"), async (req, res) => {
  try {
    const profile = await TeacherProfile.findOne({ userId: req.user._id })
      .populate("assignments.classId",   "className")
      .populate("assignments.sectionId", "sectionName");

    if (!profile)
      return res.status(404).json({ message: "Teacher profile not found. Contact your admin." });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;