const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  schoolId:    { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  classId:     { type: mongoose.Schema.Types.ObjectId, ref: "Class",  required: true },
  sectionName: { type: String, required: true }   // "A", "B", "C" …
}, { timestamps: true });

// A class can't have duplicate section names within a school
sectionSchema.index({ schoolId: 1, classId: 1, sectionName: 1 }, { unique: true });

module.exports = mongoose.model("Section", sectionSchema);