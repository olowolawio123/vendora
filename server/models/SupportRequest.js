const mongoose = require("mongoose");

const supportRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Buying",
        "Orders & Payments",
        "Account & Login",
        "Selling",
        "Safety & Security",
        "Returns & Refunds",
        "Other",
      ],
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SupportRequest",
  supportRequestSchema
);