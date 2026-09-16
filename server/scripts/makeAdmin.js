const mongoose = require("mongoose");
const dns = require("dns");
const dotenv = require("dotenv");

const User = require("../models/User");

dotenv.config();

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const makeAdmin = async () => {
  try {
    const email = process.argv[2];

    if (!email) {
      console.log("Please provide the user's email.");
      console.log("Example:");
      console.log("node scripts/makeAdmin.js your@email.com");
      process.exit(1);
    }

    const cleanEmail = email.trim().toLowerCase();

    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected");

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      console.log("User not found:", cleanEmail);
      await mongoose.disconnect();
      process.exit(1);
    }

    user.role = "admin";

    await user.save();

    console.log("");
    console.log("Admin account created successfully.");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("");

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("Unable to create admin:", error.message);

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
};

makeAdmin();