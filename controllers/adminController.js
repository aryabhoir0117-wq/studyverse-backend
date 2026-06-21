const User           = require("../models/User");
const Class          = require("../models/Class");
const Section        = require("../models/Section");
const StudentProfile = require("../models/StudentProfile");
const TeacherProfile = require("../models/TeacherProfile");
const crypto         = require("crypto");

const genTempPassword = () =>
  "SV@" + crypto.randomBytes(3).toString("hex").toUpperCase();

const genEnrollment = () =>
  "SV" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);

const genEmployeeId = async (schoolId) => {
  const count = await TeacherProfile.countDocuments({ schoolId });
  return "TC" + String(count + 1).padStart(3, "0");
};

// ── GET all users in this school ──────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({
      schoolId: req.user.schoolId,
      isActive:  true,
      role:      { $in: ["teacher", "student", "admin"] }
    }).select("-password").lean();

    const ids = users.map(u => u._id);
    const [sProfiles, tProfiles] = await Promise.all([
      StudentProfile.find({ userId: { $in: ids } })
        .populate("classId",   "className")
        .populate("sectionId", "sectionName")
        .lean(),
      TeacherProfile.find({ userId: { $in: ids } }).lean()
    ]);

    const spMap = Object.fromEntries(sProfiles.map(p => [String(p.userId), p]));
    const tpMap = Object.fromEntries(tProfiles.map(p => [String(p.userId), p]));

    const result = users.map(u => ({
      ...u,
      studentProfile: spMap[String(u._id)] || null,
      teacherProfile: tpMap[String(u._id)] || null
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── CREATE STUDENT ────────────────────────────────────────────────────────
exports.createStudent = async (req, res) => {
  try {
    const { username, email, classId, sectionId } = req.body;
    if (!username || !email)
      return res.status(400).json({ message: "Username and email required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const tempPassword = genTempPassword();

    const user = await User.create({
      username, email, password: tempPassword,
      role: "student", schoolId: req.user.schoolId, isFirstLogin: true
    });

    const enrollmentNumber = genEnrollment();
    const profile = await StudentProfile.create({
      userId: user._id, schoolId: req.user.schoolId,
      enrollmentNumber, classId: classId || null, sectionId: sectionId || null
    });

    res.status(201).json({
      message: "Student created",
      user: { _id: user._id, username, email, role: "student" },
      profile, tempPassword, enrollmentNumber
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── CREATE TEACHER ────────────────────────────────────────────────────────
exports.createTeacher = async (req, res) => {
  try {
    const { username, email, assignments } = req.body;
    // assignments = [{ classId, sectionId, subjects: ["Maths","Science"] }, ...]
 
    if (!username || !email)
      return res.status(400).json({ message: "Username and email required" });
 
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });
 
    const tempPassword = genTempPassword();
 
    const user = await User.create({
      username, email, password: tempPassword,
      role: "teacher", schoolId: req.user.schoolId, isFirstLogin: true
    });
 
    const employeeId = await genEmployeeId(req.user.schoolId);
 
    const profile = await TeacherProfile.create({
      userId:      user._id,
      schoolId:    req.user.schoolId,
      employeeId,
      assignments: assignments || []
    });
 
    res.status(201).json({
      message: "Teacher created",
      user: { _id: user._id, username, email, role: "teacher" },
      profile, tempPassword, employeeId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── BLOCK / UNBLOCK ───────────────────────────────────────────────────────
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.userId, schoolId: req.user.schoolId, isActive: true
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin")
      return res.status(403).json({ message: "Cannot block another admin" });

    user.isBlocked = true;
    await user.save();
    res.json({ message: `${user.username} blocked` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, schoolId: req.user.schoolId });
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isBlocked = false;
    await user.save();
    res.json({ message: `${user.username} unblocked` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── RESET PASSWORD ────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.userId, schoolId: req.user.schoolId, isActive: true
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const tempPassword    = genTempPassword();
    user.password         = tempPassword;
    user.isFirstLogin     = true;
    await user.save();
    res.json({ message: "Password reset", tempPassword });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── SOFT DELETE ───────────────────────────────────────────────────────────
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.userId, schoolId: req.user.schoolId, isActive: true
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin")
      return res.status(403).json({ message: "Cannot deactivate admin" });

    user.isActive = false;
    await user.save();
    res.json({ message: `${user.username} deactivated` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ASSIGN STUDENT ────────────────────────────────────────────────────────
exports.assignStudent = async (req, res) => {
  try {
    const { classId, sectionId } = req.body;
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { classId: classId || null, sectionId: sectionId || null },
      { new: true }
    );
    if (!profile) return res.status(404).json({ message: "Student profile not found" });
    res.json({ message: "Assignment updated", profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ASSIGN SUBJECTS TO TEACHER ────────────────────────────────────────────
// exports.assignSubjects = async (req, res) => {
//   try {
//     const { subjectsAssigned } = req.body;
//     const profile = await TeacherProfile.findOneAndUpdate(
//       { userId: req.params.userId },
//       { subjectsAssigned: subjectsAssigned || [] },
//       { new: true }
//     );
//     if (!profile) return res.status(404).json({ message: "Teacher profile not found" });
//     res.json({ message: "Subjects updated", profile });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// Add or update assignments for an existing teacher
exports.updateTeacherAssignments = async (req, res) => {
  try {
    const { assignments } = req.body;
    // assignments = [{ classId, sectionId, subjects: [] }]
 
    const profile = await TeacherProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { assignments },
      { new: true }
    );
    if (!profile) return res.status(404).json({ message: "Teacher profile not found" });
 
    res.json({ message: "Assignments updated", profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
// ── CLASSES ───────────────────────────────────────────────────────────────
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find({ schoolId: req.user.schoolId }).sort({ className: 1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { className } = req.body;
    if (!className) return res.status(400).json({ message: "Class name required" });
    const cls = await Class.create({ schoolId: req.user.schoolId, className });
    res.status(201).json({ message: "Class created", class: cls });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ message: "Class already exists" });
    res.status(500).json({ message: error.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    await Class.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    await Section.deleteMany({ classId: req.params.id });
    res.json({ message: "Class and its sections removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── SECTIONS ──────────────────────────────────────────────────────────────
exports.getSections = async (req, res) => {
  try {
    const q = { schoolId: req.user.schoolId };
    if (req.query.classId) q.classId = req.query.classId;
    const sections = await Section.find(q).populate("classId", "className");
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSection = async (req, res) => {
  try {
    const { classId, sectionName } = req.body;
    if (!classId || !sectionName)
      return res.status(400).json({ message: "classId and sectionName required" });
    const section = await Section.create({
      schoolId: req.user.schoolId, classId,
      sectionName: sectionName.toUpperCase()
    });
    res.status(201).json({ message: "Section created", section });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ message: "Section already exists in this class" });
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    await Section.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    res.json({ message: "Section removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ANALYTICS ─────────────────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const sid = req.user.schoolId;
    const [teachers, students, blocked, firstLogin, classes, sections] = await Promise.all([
      User.countDocuments({ schoolId: sid, role: "teacher", isActive: true }),
      User.countDocuments({ schoolId: sid, role: "student", isActive: true }),
      User.countDocuments({ schoolId: sid, isBlocked: true, isActive: true }),
      User.countDocuments({ schoolId: sid, isFirstLogin: true, isActive: true }),
      Class.countDocuments({ schoolId: sid }),
      Section.countDocuments({ schoolId: sid })
    ]);
    res.json({ teachers, students, blocked, firstLogin, classes, sections });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
