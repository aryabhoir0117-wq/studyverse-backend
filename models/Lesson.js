const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
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
  // NEW: difficulty tier for adaptive questioning
  difficulty: {
    type: String,
    enum: ["basic", "intermediate", "advanced"],
    default: "intermediate"
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Lesson", lessonSchema);