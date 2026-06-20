const User   = require("../models/User");
const School = require("../models/School");
const crypto = require("crypto");

const genTempPassword = () =>
  "SV@" + crypto.randomBytes(3).toString("hex").toUpperCase();

// ── GET all schools ───────────────────────────────────────────────────────
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });

    // Attach user counts per school
    const result = await Promise.all(schools.map(async (s) => {
      const [admins, teachers, students] = await Promise.all([
        User.countDocuments({ schoolId: s._id, role: "admin",   isActive: true }),
        User.countDocuments({ schoolId: s._id, role: "teacher", isActive: true }),
        User.countDocuments({ schoolId: s._id, role: "student", isActive: true }),
      ]);
      return { ...s.toObject(), admins, teachers, students };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── CREATE school ─────────────────────────────────────────────────────────
exports.createSchool = async (req, res) => {
  try {
    const { schoolName, board, logo } = req.body;
    if (!schoolName) return res.status(400).json({ message: "School name is required" });

    const school = await School.create({ schoolName, board, logo });
    res.status(201).json({ message: "School created", school });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── UPDATE school ─────────────────────────────────────────────────────────
exports.updateSchool = async (req, res) => {
  try {
    const { schoolName, board, logo } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { schoolName, board, logo },
      { new: true }
    );
    if (!school) return res.status(404).json({ message: "School not found" });
    res.json({ message: "School updated", school });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DEACTIVATE school (soft) ──────────────────────────────────────────────
exports.deactivateSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!school) return res.status(404).json({ message: "School not found" });
    res.json({ message: "School deactivated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── CREATE school admin ───────────────────────────────────────────────────
// This is how a school gets its first admin.
// You (superadmin) call this after creating a school.
exports.createSchoolAdmin = async (req, res) => {
  try {
    const { username, email, schoolId } = req.body;
    if (!username || !email || !schoolId)
      return res.status(400).json({ message: "username, email, and schoolId are required" });

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: "School not found" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const tempPassword = genTempPassword();

    const admin = await User.create({
      username, email,
      password:     tempPassword,
      role:         "admin",
      schoolId,
      isFirstLogin: true
    });

    res.status(201).json({
      message:      "School admin created",
      admin: {
        _id:      admin._id,
        username: admin.username,
        email:    admin.email,
        role:     "admin",
        schoolId
      },
      tempPassword, // show once — admin must change on first login
      school: { _id: school._id, schoolName: school.schoolName }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET all admins ────────────────────────────────────────────────────────
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin", isActive: true })
      .select("-password")
      .populate("schoolId", "schoolName board");
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PLATFORM ANALYTICS ────────────────────────────────────────────────────
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const [schools, admins, teachers, students, blocked] = await Promise.all([
      School.countDocuments({ isActive: true }),
      User.countDocuments({ role: "admin",   isActive: true }),
      User.countDocuments({ role: "teacher", isActive: true }),
      User.countDocuments({ role: "student", isActive: true }),
      User.countDocuments({ isBlocked: true, isActive: true }),
    ]);
    res.json({ schools, admins, teachers, students, blocked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── BLOCK / UNBLOCK admin ─────────────────────────────────────────────────
exports.blockAdmin = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "admin" });
    if (!user) return res.status(404).json({ message: "Admin not found" });
    user.isBlocked = true;
    await user.save();
    res.json({ message: `${user.username} blocked` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unblockAdmin = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "admin" });
    if (!user) return res.status(404).json({ message: "Admin not found" });
    user.isBlocked = false;
    await user.save();
    res.json({ message: `${user.username} unblocked` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
