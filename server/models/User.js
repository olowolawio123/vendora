const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationCode: {
      type: String,
      default: "",
    },

    emailVerificationCodeExpires: {
      type: Date,
      default: null,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    profileImage: {
      type: String,
      default: "",
      trim: true,
    },

    passwordResetToken: {
      type: String,
      default: "",
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    passwordResetCode: {
      type: String,
      default: "",
    },

    passwordResetCodeExpires: {
      type: Date,
      default: null,
    },

    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
    },

    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

console.log(
  "USER MODEL EMAIL CODE FIELDS:",
  "emailVerificationCode" in userSchema.paths,
  "emailVerificationCodeExpires" in userSchema.paths,
  "passwordResetCode" in userSchema.paths,
  "passwordResetCodeExpires" in userSchema.paths
);

module.exports = mongoose.model("User", userSchema);