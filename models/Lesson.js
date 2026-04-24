// ============================================================
// models/Lesson.js  — add unit + difficulty fields
// ============================================================
 
const mongoose = require("mongoose");
 
const lessonSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  unit: {
    type: String,    // "1", "2", "3"
    required: true,
    default: "1"
  },
  difficulty: {
    type: String,    // "basic" | "intermediate" | "advanced"
    enum: ["basic", "intermediate", "advanced"],
    required: true,
    default: "basic"
  },
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true
  },
  answer: {
    type: Number,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });
 
module.exports = mongoose.model("Lesson", lessonSchema);
 