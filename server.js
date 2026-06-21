require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

connectDB();

const app = express();

// ── security ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── rate limiting ──────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { message: "Too many login attempts. Try again in 15 minutes." }
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: "Too many requests. Slow down." }
});

app.use("/api/auth", authLimiter);
app.use("/api/",     apiLimiter);

// ── health ────────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("StudyVerse backend running"));

// ── routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",        require("./routes/authRoutes"));
app.use("/api/user",        require("./routes/userRoutes"));
app.use("/api/notes",       require("./routes/notesRoutes"));
app.use("/api/ai",          require("./routes/aiRoutes"));
app.use("/api/lesson-ai",   require("./routes/lessonAIRoutes"));
app.use("/api/lessons",     require("./routes/lessonRoutes"));
app.use("/api/admin",       require("./routes/adminRoutes"));       // school admin
app.use("/api/superadmin",  require("./routes/superAdminRoutes"));  // StudyVerse company
app.use("/api/teacher", require("./routes/teacherRoutes"));
app.use("/api/gk",      require("./routes/gkQuizRoutes"));
// ── start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
