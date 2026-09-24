const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    lastMessage: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    buyerUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    sellerUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * A buyer should have only one active conversation
 * with a seller about a particular product.
 */
conversationSchema.index(
  {
    buyer: 1,
    seller: 1,
    product: 1,
  },
  {
    unique: true,
  }
);

/*
 * Useful for loading a user's conversations
 * with the newest conversations first.
 */
conversationSchema.index({
  buyer: 1,
  lastMessageAt: -1,
});

conversationSchema.index({
  seller: 1,
  lastMessageAt: -1,
});

module.exports = mongoose.model(
  "Conversation",
  conversationSchema
);