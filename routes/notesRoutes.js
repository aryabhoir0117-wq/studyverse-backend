const express  = require("express");
const router   = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const Notes    = require("../models/Notes");
const { upload } = require("../config/cloudinary");
const TeacherProfile = require("../models/TeacherProfile");

// ── TEACHER: upload text notes ────────────────────────────────────────────
router.post("/upload", protect, requireRole("teacher"), async (req, res) => {
  try {
    const { classId, sectionId, subject, title, content, date } = req.body;

    if (!classId || !sectionId || !subject || !title || !content)
      return res.status(400).json({ message: "classId, sectionId, subject, title, content required" });

    const profile = await TeacherProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(403).json({ message: "Teacher profile not found" });

    const assigned = profile.assignments.find(
      a => String(a.classId) === classId &&
           String(a.sectionId) === sectionId &&
           a.subjects.includes(subject)
    );
    if (!assigned)
      return res.status(403).json({ message: "Not assigned to this class/section/subject" });

    const note = await Notes.create({
      schoolId:  req.user.schoolId,
      teacherId: req.user._id,
      classId, sectionId, subject,
      title, content, date
    });

    res.json({ message: "Notes uploaded", note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── TEACHER: upload PDF notes ─────────────────────────────────────────────
router.post("/upload-pdf", protect, requireRole("teacher"), upload.single("pdf"), async (req, res) => {
  try {
    const { classId, sectionId, subject, title, content, date } = req.body;

    if (!classId || !sectionId || !subject || !title)
      return res.status(400).json({ message: "classId, sectionId, subject, title required" });

    const note = await Notes.create({
      schoolId:  req.user.schoolId,
      teacherId: req.user._id,
      classId, sectionId, subject,
      title, content: content || "",
      pdfUrl: req.file?.path || "",
      date
    });

    res.json({ message: "PDF uploaded", note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── TEACHER: get their notes (filterable) ────────────────────────────────
router.get("/my-notes", protect, requireRole("teacher"), async (req, res) => {
  try {
    const filter = { teacherId: req.user._id };
    if (req.query.classId)   filter.classId   = req.query.classId;
    if (req.query.sectionId) filter.sectionId = req.query.sectionId;
    if (req.query.subject)   filter.subject   = req.query.subject;

    const notes = await Notes.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── STUDENT: get notes for their class+section+subject ───────────────────
router.get("/student", protect, requireRole("student"), async (req, res) => {
  try {
    const StudentProfile = require("../models/StudentProfile");
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: "Student profile not found" });

    const filter = {
      schoolId:  req.user.schoolId,
      classId:   profile.classId,
      sectionId: profile.sectionId
    };
    if (req.query.subject) filter.subject = req.query.subject;

    const notes = await Notes.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── TEACHER: edit own note ────────────────────────────────────────────────
router.put("/:id", protect, requireRole("teacher"), async (req, res) => {
  try {
    const { title, content, date } = req.body;
    const note = await Notes.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user._id },
      { title, content, date },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note updated", note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── TEACHER: delete own note ──────────────────────────────────────────────
router.delete("/:id", protect, requireRole("teacher"), async (req, res) => {
  try {
    await Notes.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });
    res.json({ message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;