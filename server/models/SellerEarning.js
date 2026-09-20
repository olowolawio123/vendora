const mongoose = require("mongoose");

const sellerEarningSchema = new mongoose.Schema(
  {
    // Seller receiving the earnings
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    // Order that generated this earning
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    // Payment that generated this earning
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },

    // Specific product that generated this earning
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Product information at the time of sale
    productTitle: {
      type: String,
      required: true,
      trim: true,
    },

    // Quantity sold
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Gross value of this seller's items
    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Vendora's commission on this earning
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Amount belonging to the seller
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Current state of the seller's money
    status: {
      type: String,
      enum: [
        "pending",
        "available",
        "withdrawal_pending",
        "withdrawn",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      default: "pending",
      index: true,
    },

    // When the earning became available for withdrawal
    availableAt: {
      type: Date,
      default: null,
    },

    // Amount already withdrawn from this earning
    withdrawnAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Amount currently reserved for a withdrawal
    // This prevents the same money from being used
    // by multiple withdrawal requests.
    reservedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Amount returned to the buyer from this earning
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional reference to the withdrawal that reserved this earning
    withdrawal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Withdrawal",
      default: null,
    },

    // Prevents the same order item from generating
    // duplicate seller earnings
    earningKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SellerEarning",
  sellerEarningSchema
);