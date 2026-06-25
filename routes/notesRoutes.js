const express  = require("express");
const router   = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const Notes    = require("../models/Notes");
const { upload } = require("../config/cloudinary");
const TeacherProfile = require("../models/TeacherProfile");

// Helper: resolve target sections from body
// Handles JSON body (array), FormData sectionIds[] (string if single item), or legacy sectionId
function resolveSections(body) {
  const { sectionId, sectionIds } = body;
  if (sectionIds) {
    const arr = Array.isArray(sectionIds) ? sectionIds : [sectionIds];
    const filtered = arr.filter(Boolean);
    if (filtered.length) return filtered;
  }
  if (sectionId) return [sectionId];
  return [];
}

// Helper: verify teacher is assigned to all target sections for the subject
async function verifyAssignments(userId, classId, targetSections, subject) {
  const profile = await TeacherProfile.findOne({ userId });
  if (!profile) return { ok: false, error: "Teacher profile not found" };

  const unauthorised = targetSections.filter(sid =>
    !profile.assignments.find(
      a => String(a.classId) === classId &&
           String(a.sectionId) === sid &&
           a.subjects.includes(subject)
    )
  );
  if (unauthorised.length) return { ok: false, error: "Not assigned to all selected sections for this subject" };
  return { ok: true };
}

// ── TEACHER: upload text notes (single or multi-section) ──────────────────
router.post("/upload", protect, requireRole("teacher"), async (req, res) => {
  try {
    const { classId, subject, title, content, date } = req.body;
    const targetSections = resolveSections(req.body);

    if (!classId || !targetSections.length || !subject || !title || !content) {
      return res.status(400).json({
        message: "classId, at least one sectionId, subject, title, and content are required"
      });
    }

    const check = await verifyAssignments(req.user._id, classId, targetSections, subject);
    if (!check.ok) return res.status(403).json({ message: check.error });

    const docs = targetSections.map(sid => ({
      schoolId:  req.user.schoolId,
      teacherId: req.user._id,
      classId,
      sectionId: sid,
      subject,
      title,
      content,
      date: date || ""
    }));

    const notes = await Notes.insertMany(docs);
    res.json({ message: `Notes broadcast to ${notes.length} section(s)`, notes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── TEACHER: upload PDF notes (single or multi-section) ───────────────────
router.post("/upload-pdf", protect, requireRole("teacher"), upload.single("pdf"), async (req, res) => {
  try {
    const { classId, subject, title, content, date } = req.body;
    const targetSections = resolveSections(req.body);

    if (!classId || !targetSections.length || !subject || !title) {
      return res.status(400).json({
        message: "classId, at least one sectionId, subject, and title are required"
      });
    }

    const check = await verifyAssignments(req.user._id, classId, targetSections, subject);
    if (!check.ok) return res.status(403).json({ message: check.error });

    const pdfUrl = req.file?.path || "";

    const docs = targetSections.map(sid => ({
      schoolId:  req.user.schoolId,
      teacherId: req.user._id,
      classId,
      sectionId: sid,
      subject,
      title,
      content: content || "",
      pdfUrl,
      date: date || ""
    }));

    const notes = await Notes.insertMany(docs);
    res.json({ message: `PDF notes broadcast to ${notes.length} section(s)`, notes });
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

    const notes = await Notes.find(filter)
      .populate("classId",   "className")
      .populate("sectionId", "sectionName")
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── STUDENT: get notes for their class+section ────────────────────────────
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