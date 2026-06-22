const express = require("express");
const router  = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const admin = require("../controllers/adminController");

const guard = [protect, requireRole("admin", "superadmin")];

// ── users ─────────────────────────────────────────────────────────────────
router.get   ("/users",                          ...guard, admin.getUsers);
router.post  ("/create-student",                 ...guard, admin.createStudent);
router.post  ("/create-teacher",                 ...guard, admin.createTeacher);
router.patch ("/block/:userId",                  ...guard, admin.blockUser);
router.patch ("/unblock/:userId",                ...guard, admin.unblockUser);
router.patch ("/reset-password/:userId",         ...guard, admin.resetPassword);
router.delete("/deactivate/:userId",             ...guard, admin.deactivateUser);
router.patch ("/assign-student/:userId",         ...guard, admin.assignStudent);
router.patch ("/assign-teacher/:userId",         ...guard, admin.updateTeacherAssignments);

// ── classes ───────────────────────────────────────────────────────────────
router.get   ("/classes",      ...guard, admin.getClasses);
router.post  ("/classes",      ...guard, admin.createClass);
router.delete("/classes/:id",  ...guard, admin.deleteClass);

// ── sections ──────────────────────────────────────────────────────────────
router.get   ("/sections",     ...guard, admin.getSections);
router.post  ("/sections",     ...guard, admin.createSection);
router.delete("/sections/:id", ...guard, admin.deleteSection);

// ── analytics ─────────────────────────────────────────────────────────────
router.get("/analytics",       ...guard, admin.getAnalytics);

module.exports = router;