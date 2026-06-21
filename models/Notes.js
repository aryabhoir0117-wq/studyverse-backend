const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema({
   schoolId:  { type: mongoose.Schema.Types.ObjectId, ref: "School",  required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
  classId:   { type: mongoose.Schema.Types.ObjectId, ref: "Class",   required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
  subject:   { type: String, required: true },
  title:     { type: String, required: true },
  content:   { type: String, default: "" },
  pdfUrl:    { type: String, default: "" },
  date:      { type: String, default: "" }
}, { timestamps: true });
 
module.exports = mongoose.model("Notes", notesSchema);
 