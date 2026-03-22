const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ""
  },
  pdfUrl: {
    type: String,
    default: ""
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Notes", notesSchema);