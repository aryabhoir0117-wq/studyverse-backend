const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Notes = require("../models/Notes");

// Teacher uploads notes
router.post("/upload", protect, async (req, res) => {
  try {
    const { subject, content } = req.body;

    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can upload notes" });
    }

    // Replace existing notes for same subject by same teacher
    await Notes.findOneAndUpdate(
      { subject, teacherId: req.user._id },
      { content },
      { upsert: true, new: true }
    );

    res.json({ message: "Notes uploaded successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student views notes by subject
router.get("/:subject", protect, async (req, res) => {
  try {
    const notes = await Notes.findOne({ subject: req.params.subject });

    if (!notes) {
      return res.status(404).json({ message: "No notes found for this subject" });
    }

    res.json(notes);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;