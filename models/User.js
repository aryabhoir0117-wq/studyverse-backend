const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({

  // ── multi-tenant anchor ───────────────────────────────────────────────────
  // null = superadmin (platform level, not tied to any school)
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    default: null
  },

  // ── identity ──────────────────────────────────────────────────────────────
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // ── roles ─────────────────────────────────────────────────────────────────
  // superadmin → StudyVerse company (you)
  // admin      → school principal/coordinator chosen by you
  // teacher    → created by school admin
  // student    → created by school admin
  role: {
    type: String,
    enum: ["superadmin", "admin", "teacher", "student"],
    default: "student"
  },

  // ── lifecycle flags ───────────────────────────────────────────────────────
  isFirstLogin: { type: Boolean, default: true  }, // forces password change on first login
  isBlocked:    { type: Boolean, default: false }, // admin can block/unblock
  isActive:     { type: Boolean, default: true  }, // soft delete — never hard delete

  // ── Google OAuth ──────────────────────────────────────────────────────────
  googleId: { type: String, default: null },

  // ── gamification (existing — untouched) ──────────────────────────────────
  xp:                { type: Number, default: 0 },
  bounty:            { type: Number, default: 0 },
  streak:            { type: Number, default: 0 },
  lastStudyDate:     { type: String, default: "" },
  lessonsCompleted:  { type: Number, default: 0 },
  rank:              { type: String, default: "Cabin Boy" },
  lastTreasureClaim: { type: String, default: "" }

}, { timestamps: true });

// ── single password hashing hook (removes the duplicate bug) ─────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (this.googleId) return; // Google users have unusable password, skip hash
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", userSchema);

