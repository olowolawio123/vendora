const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "NGN",
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "successful",
        "failed",
        "reversed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    recipientCode: {
      type: String,
      required: true,
      trim: true,
    },

    bankCode: {
      type: String,
      required: true,
      trim: true,
    },

    bankName: {
      type: String,
      required: true,
      trim: true,
    },

    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },

    accountName: {
      type: String,
      required: true,
      trim: true,
    },

    transferCode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    transferReference: {
      type: String,
      default: "",
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    failureReason: {
      type: String,
      default: "",
      trim: true,
    },

    paystackResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Withdrawal",
  withdrawalSchema
);