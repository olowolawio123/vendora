const express = require("express");
const mongoose = require("mongoose");

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Product = require("../models/Product");
const Seller = require("../models/Seller");
const protect = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CREATE OR GET CONVERSATION
|--------------------------------------------------------------------------
| Buyer starts a conversation about a product.
|
| POST /api/messages/conversations
|
| Body:
| {
|   productId: "...",
|   sellerId: "..."
| }
|--------------------------------------------------------------------------
*/
router.post("/conversations", protect, async (req, res) => {
  try {
    const { productId, sellerId } = req.body;

    if (!productId || !sellerId) {
      return res.status(400).json({
        success: false,
        message: "Product and seller are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(productId) ||
      !mongoose.Types.ObjectId.isValid(sellerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product or seller ID",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const seller = await Seller.findById(sellerId);

if (!seller) {
  return res.status(404).json({
    success: false,
    message: "Seller not found",
  });
}

if (seller.status !== "approved") {
  return res.status(403).json({
    success: false,
    message: "This seller is not currently available for messaging",
  });
}

    /*
     * Prevent a seller from messaging themselves.
     */
    if (
      seller.user &&
      seller.user.toString() === req.user.userId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot start a conversation with yourself",
      });
    }

    /*
     * Only buyers should start buyer-to-seller conversations.
     */
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can start a product conversation",
      });
    }

    let conversation = await Conversation.findOne({
      buyer: req.user.userId,
      seller: sellerId,
      product: productId,
    })
      .populate("product", "title images price")
      .populate("seller", "storeName location rating")
      .populate("buyer", "name email");

    if (conversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        conversation,
      });
    }

    conversation = await Conversation.create({
      buyer: req.user.userId,
      seller: sellerId,
      product: productId,
      lastMessage: "",
      lastMessageAt: new Date(),
      buyerUnreadCount: 0,
      sellerUnreadCount: 0,
      status: "active",
    });

    conversation = await Conversation.findById(
      conversation._id
    )
      .populate("product", "title images price")
      .populate("seller", "storeName location rating")
      .populate("buyer", "name email");

    return res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      conversation,
    });
  } catch (error) {
    console.error(
      "Create conversation error:",
      error
    );

    /*
     * Handles the unique index race condition.
     */
    if (error.code === 11000) {
      try {
        const conversation =
          await Conversation.findOne({
            buyer: req.user.userId,
            seller: req.body.sellerId,
            product: req.body.productId,
          })
            .populate(
              "product",
              "title images price"
            )
            .populate(
              "seller",
              "storeName location rating"
            )
            .populate(
              "buyer",
              "name email"
            );

        return res.status(200).json({
          success: true,
          message: "Conversation already exists",
          conversation,
        });
      } catch (findError) {
        console.error(
          "Find existing conversation error:",
          findError
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create conversation",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET MY CONVERSATIONS
|--------------------------------------------------------------------------
| Returns conversations belonging to the logged-in buyer or seller.
|
| GET /api/messages/conversations
|--------------------------------------------------------------------------
*/
router.get(
  "/conversations",
  protect,
  async (req, res) => {
    try {
      const userId = req.user.userId;

      let conversations;

      if (req.user.role === "buyer") {
        conversations = await Conversation.find({
          buyer: userId,
        })
          .populate(
            "product",
            "title images price"
          )
          .populate(
            "seller",
            "storeName location rating"
          )
          .populate(
            "buyer",
            "name email"
          )
          .sort({
            lastMessageAt: -1,
          });
      } else {
        /*
         * Seller records use Seller.user to connect
         * the seller account to the User account.
         */
        const seller = await Seller.findOne({
          user: userId,
        });

        if (!seller) {
          return res.status(403).json({
            success: false,
            message:
              "Seller profile not found",
          });
        }

        conversations =
          await Conversation.find({
            seller: seller._id,
          })
            .populate(
              "product",
              "title images price"
            )
            .populate(
              "buyer",
              "name email"
            )
            .populate(
              "seller",
              "storeName location rating"
            )
            .sort({
              lastMessageAt: -1,
            });
      }

      return res.status(200).json({
        success: true,
        count: conversations.length,
        conversations,
      });
    } catch (error) {
      console.error(
        "Get conversations error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load conversations",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET CONVERSATION MESSAGES
|--------------------------------------------------------------------------
|
| GET /api/messages/conversations/:conversationId
|--------------------------------------------------------------------------
*/
router.get(
  "/conversations/:conversationId",
  protect,
  async (req, res) => {
    try {
      const { conversationId } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          conversationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversation ID",
        });
      }

      const conversation =
        await Conversation.findById(
          conversationId
        )
          .populate(
            "product",
            "title images price"
          )
          .populate(
            "buyer",
            "name email"
          )
          .populate(
            "seller",
            "storeName location rating user"
          );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }

      /*
       * Check whether the logged-in user belongs
       * to this conversation.
       */
      let hasAccess = false;

      if (
        conversation.buyer?._id?.toString() ===
        req.user.userId.toString()
      ) {
        hasAccess = true;
      }

      if (
        conversation.seller?.user?.toString() ===
        req.user.userId.toString()
      ) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this conversation",
        });
      }

      const messages =
        await Message.find({
          conversation: conversationId,
        })
          .populate(
            "sender",
            "name email"
          )
          .populate(
            "receiver",
            "name email"
          )
          .sort({
            createdAt: 1,
          });

      /*
       * Mark messages received by the current user
       * as read.
       */
      await Message.updateMany(
        {
          conversation: conversationId,
          receiver: req.user.userId,
          read: false,
        },
        {
          $set: {
            read: true,
          },
        }
      );

      if (
        conversation.buyer?._id?.toString() ===
        req.user.userId.toString()
      ) {
        conversation.buyerUnreadCount = 0;
      }

      if (
        conversation.seller?.user?.toString() ===
        req.user.userId.toString()
      ) {
        conversation.sellerUnreadCount = 0;
      }

      await conversation.save();

      return res.status(200).json({
        success: true,
        conversation,
        messages,
      });
    } catch (error) {
      console.error(
        "Get conversation messages error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load conversation",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| SEND MESSAGE
|--------------------------------------------------------------------------
|
| POST /api/messages/conversations/:conversationId
|
| Body:
| {
|   text: "Hello, is this product still available?"
| }
|--------------------------------------------------------------------------
*/
router.post(
  "/conversations/:conversationId",
  protect,
  async (req, res) => {
    try {
      const { conversationId } =
        req.params;

      const { text } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          conversationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversation ID",
        });
      }

      if (
        !text ||
        typeof text !== "string" ||
        !text.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Message cannot be empty",
        });
      }

      const messageText = text.trim();

      if (messageText.length > 2000) {
        return res.status(400).json({
          success: false,
          message:
            "Message cannot exceed 2000 characters",
        });
      }

      const conversation =
        await Conversation.findById(
          conversationId
        ).populate(
          "seller",
          "user"
        );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }

      if (conversation.status === "closed") {
        return res.status(400).json({
          success: false,
          message:
            "This conversation has been closed",
        });
      }

      const currentUserId =
        req.user.userId.toString();

      const buyerId =
        conversation.buyer.toString();

      const sellerUserId =
        conversation.seller?.user
          ?.toString();

      let receiverId;

      if (currentUserId === buyerId) {
        receiverId = sellerUserId;
      } else if (
        currentUserId === sellerUserId
      ) {
        receiverId = buyerId;
      } else {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this conversation",
        });
      }

      if (!receiverId) {
        return res.status(500).json({
          success: false,
          message:
            "Unable to determine message recipient",
        });
      }

      const message =
        await Message.create({
          conversation:
            conversationId,
          sender: req.user.userId,
          receiver: receiverId,
          text: messageText,
          read: false,
        });

      /*
       * Update conversation preview and unread count.
       */
      conversation.lastMessage =
        messageText;

      conversation.lastMessageAt =
        message.createdAt;

      if (currentUserId === buyerId) {
        conversation.sellerUnreadCount += 1;
      } else {
        conversation.buyerUnreadCount += 1;
      }

      await conversation.save();

/*
 * Create a notification for the message recipient.
 *
 * This is intentionally separate from the message itself.
 * If notification creation fails, the message should still
 * remain successfully sent.
 */
try {
  await Notification.create({
    user: receiverId,
    type: "new_message",
    title: "New message",
    message: "You have received a new message.",
    conversation: conversation._id,
    isRead: false,
  });

  /*
   * Tell the frontend that a notification was created.
   * This event can be used by the Navbar later.
   */
} catch (notificationError) {
  console.error(
    "Create message notification error:",
    notificationError
  );
}

const populatedMessage =
  await Message.findById(
    message._id
  )
    .populate(
      "sender",
      "name email"
    )
    .populate(
      "receiver",
      "name email"
    );

      return res.status(201).json({
        success: true,
        message:
          "Message sent successfully",
        data: populatedMessage,
      });
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to send message",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| MARK CONVERSATION AS READ
|--------------------------------------------------------------------------
|
| PATCH /api/messages/conversations/:conversationId/read
|--------------------------------------------------------------------------
*/
router.patch(
  "/conversations/:conversationId/read",
  protect,
  async (req, res) => {
    try {
      const { conversationId } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          conversationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversation ID",
        });
      }

      const conversation =
        await Conversation.findById(
          conversationId
        ).populate(
          "seller",
          "user"
        );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }

      const userId =
        req.user.userId.toString();

      const isBuyer =
        conversation.buyer.toString() ===
        userId;

      const isSeller =
        conversation.seller?.user?.toString() ===
        userId;

      if (!isBuyer && !isSeller) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this conversation",
        });
      }

      await Message.updateMany(
        {
          conversation: conversationId,
          receiver: req.user.userId,
          read: false,
        },
        {
          $set: {
            read: true,
          },
        }
      );

      if (isBuyer) {
        conversation.buyerUnreadCount = 0;
      }

      if (isSeller) {
        conversation.sellerUnreadCount = 0;
      }

      await conversation.save();

      return res.status(200).json({
        success: true,
        message:
          "Conversation marked as read",
      });
    } catch (error) {
      console.error(
        "Mark conversation read error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to mark conversation as read",
      });
    }
  }
);

module.exports = router;