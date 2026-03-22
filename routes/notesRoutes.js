const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Notes = require("../models/Notes");
const { upload } = require("../config/cloudinary");

// Teacher uploads text notes
router.post("/upload", protect, async (req, res) => {
  try {
    const { subject, content, title, date } = req.body;

    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can upload notes" });
    }

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const note = await Notes.create({
      title,
      subject,
      content,
      date,
      teacherId: req.user._id
    });

    res.json({ message: "Notes uploaded successfully", note });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher uploads PDF
router.post("/upload-pdf", protect, upload.single("pdf"), async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can upload PDFs" });
    }

    const { subject, title, content, date } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const pdfUrl = req.file.path;

    const note = await Notes.create({
      title,
      subject,
      content,
      pdfUrl,
      date,
      teacherId: req.user._id
    });

    res.json({ message: "PDF uploaded successfully", note });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher gets all their notes
router.get("/my-notes", protect, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view their notes" });
    }

    const notes = await Notes.find({ teacherId: req.user._id }).sort({ createdAt: -1 });

    res.json(notes);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher edits a note
router.put("/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can edit notes" });
    }

    const { title, content, date } = req.body;

    const note = await Notes.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user._id },
      { title, content, date },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note updated", note });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher deletes a note
router.delete("/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can delete notes" });
    }

    await Notes.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });

    res.json({ message: "Note deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student gets all notes by subject
router.get("/subject/:subject", protect, async (req, res) => {
  try {
    const notes = await Notes.find({ subject: req.params.subject }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;