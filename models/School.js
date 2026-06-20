const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema({
  schoolName: { type: String, required: true },
  board:      { type: String, default: "" },   // e.g. CBSE, ICSE, State
  logo:       { type: String, default: "" }    // URL or initials
}, { timestamps: true });

module.exports = mongoose.model("School", schoolSchema);