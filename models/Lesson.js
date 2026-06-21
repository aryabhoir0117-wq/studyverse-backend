const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  schoolId:  { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
  classId:   { type: mongoose.Schema.Types.ObjectId, ref: "Class",  required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section",required: true },
  subject:   { type: String, required: true },
  question:  { type: String, required: true },
  options:   { type: [String], required: true },
  answer:    { type: Number,  required: true }
}, { timestamps: true });
 
module.exports = mongoose.model("Lesson", lessonSchema);
 