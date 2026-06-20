const express = require("express");
const router  = express.Router();
const { registerUser, loginUser, changePassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { OAuth2Client } = require("google-auth-library");
const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/register", registerUser);
router.post("/login",    loginUser);
router.get ("/test",     (req, res) => res.json({ message: "StudyVerse backend running" }));

// Force password change on first login
router.post("/change-password", protect, changePassword);

// Google OAuth (student/teacher only — admin never uses Google)
router.post("/google", async (req, res) => {
  const { credential, role } = req.body;
  if (!credential)
    return res.status(400).json({ message: "No Google credential provided" });

  try {
    const ticket  = await googleClient.verifyIdToken({
      idToken: credential, audience: process.env.GOOGLE_CLIENT_ID
    });
    const { email, name, sub: googleId, picture } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      const baseUsername = name.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18) || "pirate";
      let username = baseUsername, attempt = 1;
      while (await User.findOne({ username })) username = baseUsername + attempt++;

      const safeRole = ["student", "teacher"].includes(role) ? role : "student";
      user = await User.create({
        username, email,
        password:     googleId + process.env.JWT_SECRET,
        role:         safeRole,
        googleId,
        isFirstLogin: false
      });
    } else {
      if (!user.googleId) { user.googleId = googleId; await user.save(); }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      username:     user.username,
      email:        user.email,
      role:         user.role,
      schoolId:     user.schoolId,
      isFirstLogin: user.isFirstLogin,
      xp:           user.xp     || 0,
      bounty:       user.bounty || 0,
      streak:       user.streak || 0,
      rank:         user.rank,
      lessonsCompleted: user.lessonsCompleted || 0
    });
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(401).json({ message: "Google sign-in failed. Try again." });
  }
});

module.exports = router;
