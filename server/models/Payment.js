const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // Vendora order connected to this payment
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },

    // Buyer who made the payment
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Paystack transaction reference
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // Paystack transaction ID
    transactionId: {
      type: String,
      default: "",
      trim: true,
    },

    // Total amount paid by the buyer in NGN
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

    // Payment state inside Vendora
    status: {
      type: String,
      enum: [
        "pending",
        "successful",
        "failed",
        "abandoned",
        "refunded",
        "partially_refunded",
      ],
      default: "pending",
      index: true,
    },

    // How the customer paid
    channel: {
      type: String,
      default: "",
      trim: true,
    },

    // Paystack gateway response/status
    gatewayResponse: {
      type: String,
      default: "",
      trim: true,
    },

    // Paystack transaction timestamp
    paidAt: {
      type: Date,
      default: null,
    },

    // Vendora's marketplace commission from this payment
    commissionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Amount belonging to sellers after Vendora commission
    sellerAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Amount refunded to the buyer
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Paystack refund reference, when a refund occurs
    refundReference: {
      type: String,
      default: "",
      trim: true,
    },

    // When the payment was refunded
    refundedAt: {
      type: Date,
      default: null,
    },

    // Raw/important Paystack verification information
    paystackData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Prevents the same Paystack transaction from being processed twice
    verificationProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },

    // When Vendora successfully verified the payment
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);