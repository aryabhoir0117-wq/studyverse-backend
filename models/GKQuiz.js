const mongoose = require("mongoose");

const gkQuizSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // "Mon Jun 21 2026"

  headlines: [{
    title:   { type: String },  // short punchy headline
    brief:   { type: String },  // 2-3 sentence kid-friendly summary
    emoji:   { type: String }   // visual hook e.g. "🚀"
  }],

  questions: [{
    question: { type: String },
    options:  [{ type: String }],
    answer:   { type: Number },  // index 0-3
    explanation: { type: String }
  }]

}, { timestamps: true });

module.exports = mongoose.model("GKQuiz", gkQuizSchema);