// const express = require("express");
// const router = express.Router();
// const { protect } = require("../middleware/authMiddleware");
// const Lesson = require("../models/Lesson");

// // Teacher saves a lesson
// router.post("/save", protect, async (req, res) => {
//   try {
//     if (req.user.role !== "teacher") {
//       return res.status(403).json({ message: "Only teachers can save lessons" });
//     }

//     const { subject, question, options, answer } = req.body;

//     if (!question || !options || options.length !== 4) {
//       return res.status(400).json({ message: "All fields required" });
//     }

//     const lesson = await Lesson.create({
//       subject,
//       question,
//       options,
//       answer,
//       teacherId: req.user._id
//     });

//     res.json({ message: "Lesson saved successfully", lesson });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Get all lessons by subject
// router.get("/:subject", protect, async (req, res) => {
//   try {
//     const lessons = await Lesson.find({ subject: req.params.subject });
//     res.json(lessons);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Teacher gets all their lessons
// router.get("/my/lessons", protect, async (req, res) => {
//   try {
//     if (req.user.role !== "teacher") {
//       return res.status(403).json({ message: "Only teachers can view their lessons" });
//     }
//     const lessons = await Lesson.find({ teacherId: req.user._id }).sort({ createdAt: -1 });
//     res.json(lessons);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Teacher deletes a lesson
// router.delete("/:id", protect, async (req, res) => {
//   try {
//     if (req.user.role !== "teacher") {
//       return res.status(403).json({ message: "Only teachers can delete lessons" });
//     }
//     await Lesson.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });
//     res.json({ message: "Lesson deleted" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// module.exports = router;

// ============================================================
// routes/lessonRoutes.js  — updated with unit+difficulty support
// ============================================================
 
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Lesson = require("../models/Lesson");
 
//Teacher saves a lesson
router.post("/save", protect, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can save lessons" });
    }
    const { subject, unit, difficulty, question, options, answer } = req.body;
    if (!question || !options || options.length !== 4 || !unit || !difficulty) {
      return res.status(400).json({ message: "All fields required" });
    }
    const lesson = await Lesson.create({
      subject, unit, difficulty, question, options, answer,
      teacherId: req.user._id
    });
    res.json({ message: "Lesson saved successfully", lesson });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
//GET /api/lessons/filter?subject=maths&unit=1&difficulty=basic
router.get("/filter", protect, async (req, res) => {
  try {
    const { subject, unit, difficulty } = req.query;
    const lessons = await Lesson.find({ subject, unit, difficulty });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
//Teacher gets all their lessons
router.get("/my/lessons", protect, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view their lessons" });
    }
    const lessons = await Lesson.find({ teacherId: req.user._id }).sort({ createdAt: -1 });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
//Teacher deletes a lesson
router.delete("/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can delete lessons" });
    }
    await Lesson.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });
    res.json({ message: "Lesson deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
module.exports = router;