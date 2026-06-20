/**
 * StudyVerse — Superadmin Seed Script
 *
 * Run ONCE after deploying:
 *   node scripts/seed.js
 *
 * Add these to your .env before running:
 *   SUPERADMIN_EMAIL=you@studyverse.com
 *   SUPERADMIN_PASSWORD=YourStrongPassword123!
 *   SUPERADMIN_USERNAME=studyverse_admin
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User     = require("../models/User");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const email    = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;
    const username = process.env.SUPERADMIN_USERNAME || "studyverse_admin";

    if (!email || !password) {
      console.error("ERROR: Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env");
      process.exit(1);
    }

    const existing = await User.findOne({ role: "superadmin" });
    if (existing) {
      console.log("Superadmin already exists:", existing.email);
      process.exit(0);
    }

    const superadmin = await User.create({
      username,
      email,
      password,          // will be hashed by pre-save hook
      role:         "superadmin",
      schoolId:     null, // superadmin is not tied to any school
      isFirstLogin: false,
      isActive:     true
    });

    console.log("✅ Superadmin created successfully");
    console.log("   Email:   ", superadmin.email);
    console.log("   Username:", superadmin.username);
    console.log("   Role:    ", superadmin.role);
    console.log("\nDelete or disable this script after running.");

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
