// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   xp: {
//     type: Number,
//     default: 0
//   },
//   role: {
//     type: String,
//     enum: ["user", "admin"],
//     default: "user"
//   }
// }, { timestamps: true });

// userSchema.pre("save", async function(next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// userSchema.methods.matchPassword = async function(enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("User", userSchema);
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["student", "teacher"],
    default: "student"
  },
  xp: {
    type: Number,
    default: 0
  },
  bounty: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  lastStudyDate: {
    type: String,
    default: ""
  },
  lessonsCompleted: {
    type: Number,
    default: 0
  },
  rank: {
    type: String,
    default: "Cabin Boy"
  },
  lastTreasureClaim: {
  type: String,
  default: ""
}
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);