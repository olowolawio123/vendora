const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    if (error.reason?.servers) {
      for (const [server, details] of error.reason.servers) {
        console.error(
          `${server}:`,
          details.error?.message || details.type
        );
      }
    }

    process.exit(1);
  }
};

module.exports = connectDB;