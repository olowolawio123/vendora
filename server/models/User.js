const mongoose = require("mongoose");

const trustedDeviceSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

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

    /*
     * LOGIN VERIFICATION
     *
     * These fields are used when a user logs in from
     * a new device or when their trusted-device period
     * has expired.
     */

    loginVerificationCode: {
      type: String,
      default: "",
    },

    loginVerificationCodeExpires: {
      type: Date,
      default: null,
    },

    loginVerificationAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    loginVerificationLastSentAt: {
      type: Date,
      default: null,
    },

    /*
     * LOGIN VERIFICATION DEVICE
     *
     * When a user successfully verifies a login code,
     * Vendora creates a secure random device token.
     *
     * Only the SHA-256 hash of the token is stored here.
     * The actual token is never stored in MongoDB.
     *
     * Each trusted device expires after 1 hour.
     */

    trustedDevices: {
      type: [trustedDeviceSchema],
      default: [],
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

console.log(
  "USER MODEL LOGIN SECURITY FIELDS:",
  "loginVerificationCode" in userSchema.paths,
  "loginVerificationCodeExpires" in userSchema.paths,
  "loginVerificationAttempts" in userSchema.paths,
  "loginVerificationLastSentAt" in userSchema.paths,
  "trustedDevices" in userSchema.paths
);

module.exports = mongoose.model("User", userSchema);