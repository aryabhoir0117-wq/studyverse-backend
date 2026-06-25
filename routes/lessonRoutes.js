const express  = require("express");
const router   = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const Lesson   = require("../models/Lesson");
const TeacherProfile = require("../models/TeacherProfile");

// ── TEACHER: save lesson (single OR multi-section broadcast) ───────────────
// Body: { classId, sectionIds: ["id1","id2"] OR sectionId: "id", subject, question, options, answer }
router.post("/save", protect, requireRole("teacher"), async (req, res) => {
  try {
    const { classId, sectionId, sectionIds, subject, question, options, answer } = req.body;

    // Resolve target sections — support both single and array
    const targetSections = sectionIds && sectionIds.length
      ? sectionIds
      : sectionId
        ? [sectionId]
        : [];

    if (!classId || !targetSections.length || !subject || !question || !options || options.length !== 4) {
      return res.status(400).json({ message: "classId, at least one sectionId, subject, question, and 4 options are required" });
    }

    // Verify teacher is assigned to this class + each target section + subject
    const profile = await TeacherProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(403).json({ message: "Teacher profile not found" });

    const unauthorised = targetSections.filter(sid =>
      !profile.assignments.find(
        a => String(a.classId) === classId &&
             String(a.sectionId) === sid &&
             a.subjects.includes(subject)
      )
    );
    if (unauthorised.length) {
      return res.status(403).json({ message: "Not assigned to all selected sections for this subject" });
    }

    // Create one lesson doc per target section
    const docs = targetSections.map(sid => ({
      schoolId:  req.user.schoolId,
      teacherId: req.user._id,
      classId,
      sectionId: sid,
      subject,
      question,
      options,
      answer
    }));

    const lessons = await Lesson.insertMany(docs);
    res.json({ message: `Lesson broadcast to ${lessons.length} section(s)`, lessons });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── TEACHER: get all their own lessons ────────────────────────────────────
router.get("/my/lessons", protect, requireRole("teacher"), async (req, res) => {
  try {
    const filter = { teacherId: req.user._id };
    if (req.query.classId)   filter.classId   = req.query.classId;
    if (req.query.sectionId) filter.sectionId = req.query.sectionId;
    if (req.query.subject)   filter.subject   = req.query.subject;

    const lessons = await Lesson.find(filter)
      .populate("classId",   "className")
      .populate("sectionId", "sectionName")
      .sort({ createdAt: -1 });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── STUDENT: get lessons for their class+section+subject ──────────────────
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

    const lessons = await Lesson.find(filter).sort({ createdAt: -1 });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── STUDENT: get subjects available for their class+section ───────────────
router.get("/my-subjects", protect, requireRole("student"), async (req, res) => {
  try {
    const StudentProfile = require("../models/StudentProfile");
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: "Student profile not found" });

    const subjects = await Lesson.distinct("subject", {
      schoolId:  req.user.schoolId,
      classId:   profile.classId,
      sectionId: profile.sectionId
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── TEACHER: delete own lesson ────────────────────────────────────────────
router.delete("/:id", protect, requireRole("teacher"), async (req, res) => {
  try {
    await Lesson.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });
    res.json({ message: "Lesson deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;