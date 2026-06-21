const mongoose = require("mongoose");

const teacherProfileSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true, unique: true },
  schoolId:   { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  employeeId: { type: String, required: true, unique: true },

  // A teacher can teach multiple class+section combinations
  // e.g. [{ classId, sectionId, subjects: ["Maths","Science"] }]
  assignments: [{
    classId:   { type: mongoose.Schema.Types.ObjectId, ref: "Class"   },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    subjects:  [{ type: String }]
  }]

}, { timestamps: true });

module.exports = mongoose.model("TeacherProfile", teacherProfileSchema);