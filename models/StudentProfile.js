const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true, unique: true },
  schoolId:         { type: mongoose.Schema.Types.ObjectId, ref: "School",  required: true },
  enrollmentNumber: { type: String, required: true, unique: true },
  classId:          { type: mongoose.Schema.Types.ObjectId, ref: "Class",   default: null },
  sectionId:        { type: mongoose.Schema.Types.ObjectId, ref: "Section", default: null }
}, { timestamps: true });

module.exports = mongoose.model("StudentProfile", studentProfileSchema);