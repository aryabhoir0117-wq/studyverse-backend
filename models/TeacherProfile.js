const mongoose = require("mongoose");

const teacherProfileSchema = new mongoose.Schema({
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true, unique: true },
  schoolId:          { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  employeeId:        { type: String, required: true, unique: true },
  subjectsAssigned:  [{ type: String }]   // e.g. ["maths", "science"]
}, { timestamps: true });

module.exports = mongoose.model("TeacherProfile", teacherProfileSchema);