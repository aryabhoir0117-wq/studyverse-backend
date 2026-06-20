const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  schoolId:  { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  className: { type: String, required: true }   // "Class 1" … "Class 12"
}, { timestamps: true });

// A school can't have duplicate class names
classSchema.index({ schoolId: 1, className: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);