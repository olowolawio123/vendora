const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // User who submitted the report
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // User being reported, if applicable
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Seller being reported, if applicable
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      default: null,
    },

    // Product being reported, if applicable
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    // Order related to the report, if applicable
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    category: {
      type: String,
      enum: [
        "fraud",
        "counterfeit",
        "prohibited-item",
        "misleading-listing",
        "scam",
        "harassment",
        "payment-issue",
        "other",
      ],
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    evidence: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "open",
        "under-review",
        "resolved",
        "dismissed",
      ],
      default: "open",
      index: true,
    },

    adminNotes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 3000,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Report",
  reportSchema
);