const User = require("../models/User");
const jwt  = require("jsonwebtoken");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ── REGISTER ─────────────────────────────────────────────────────────────
// Only for student/teacher self-signup (Google OAuth path).
// admin and superadmin are NEVER created here — only via seed/superadmin panel.
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Hard block — public registration can never produce admin/superadmin
    const safeRole = ["student", "teacher"].includes(role) ? role : "student";

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      username, email, password,
      role: safeRole,
      isFirstLogin: false // self-registered users don't need forced password change
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      xp: user.xp, bounty: user.bounty,
      streak: user.streak, rank: user.rank,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────
// Single endpoint. Backend returns role. Frontend redirects.
// Redirect map:
//   superadmin → /pages/superadmin-dashboard.html
//   admin      → /pages/admin-dashboard.html
//   teacher    → /pages/teacher-dashboard.html
//   student    → /pages/dashboard.html
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isActive)
      return res.status(401).json({ message: "Account deactivated. Contact your admin." });

    if (user.isBlocked)
      return res.status(403).json({ message: "Account blocked. Contact your school admin." });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      _id:          user._id,
      username:     user.username,
      email:        user.email,
      role:         user.role,         // frontend uses this to redirect
      schoolId:     user.schoolId,
      isFirstLogin: user.isFirstLogin, // frontend shows force-change modal if true
      xp:           user.xp,
      bounty:       user.bounty,
      streak:       user.streak,
      rank:         user.rank,
      token:        generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── CHANGE PASSWORD (first login forced reset) ────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters" });

    const user       = await User.findById(req.user._id);
    user.password     = newPassword;
    user.isFirstLogin = false;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
