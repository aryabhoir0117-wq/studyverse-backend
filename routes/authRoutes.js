// 
// ADD THIS TO: routes/authRoutes.js
// npm install google-auth-library   (run this once in your backend)
// 

const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── existing routes (unchanged) ─────────────────────────────
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/test", (req, res) => res.json({ message: "Backend working" }));

// ── NEW: Google OAuth ────────────────────────────────────────
router.post("/google", async (req, res) => {
  const { credential, role } = req.body;
  // credential = Google ID token from the frontend GSI button

  if (!credential) {
    return res.status(400).json({ message: "No Google credential provided" });
  }

  try {
    // 1. Verify the token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    // 2. Find or create the user
    let user = await User.findOne({ email });

    if (!user) {
      // New user — create them
      // Build a safe username from their Google display name
      const baseUsername = name
        .replace(/[^a-zA-Z0-9_]/g, "")   // strip special chars
        .slice(0, 18) || "pirate";

      // Make sure username is unique
      let username = baseUsername;
      let attempt  = 1;
      while (await User.findOne({ username })) {
        username = baseUsername + attempt++;
      }

      user = await User.create({
        username,
        email,
        password: googleId + process.env.JWT_SECRET, // unusable password — Google users can't log in with password
        role: role || "student",
        googleId,
        avatar: picture || "",
        xp: 0,
        streak: 0,
        lessonsCompleted: 0,
      });
    } else {
      // Existing user — patch googleId if they registered normally before
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    // 3. Issue your existing JWT (same shape as loginUser)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      username: user.username,
      email:    user.email,
      role:     user.role,
      xp:       user.xp     || 0,
      streak:   user.streak || 0,
      lessonsCompleted: user.lessonsCompleted || 0,
    });

  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(401).json({ message: "Google sign-in failed. Try again." });
  }
});

module.exports = router;