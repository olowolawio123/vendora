const express = require("express");

const User = require("../models/User");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Order = require("../models/Order");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const Payment = require("../models/Payment");
const Refund = require("../models/Refund");
const {
  refundTransaction,
} = require("../services/paystackRefundService");

const router = express.Router();

// =====================================================
// GET ADMIN DASHBOARD STATS
// ADMIN ONLY
// =====================================================
router.get(
  "/stats",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalSellers,
        totalProducts,
        totalOrders,
        pendingSellers,
      ] = await Promise.all([
        User.countDocuments({}),

        User.countDocuments({
          role: "seller",
        }),

        Product.countDocuments({}),

        Order.countDocuments({}),

        Seller.countDocuments({
          status: "pending",
        }),
      ]);

      res.json({
        success: true,
        stats: {
          totalUsers,
          totalSellers,
          totalProducts,
          totalOrders,
          pendingSellers,
        },
      });
    } catch (error) {
      console.error(
        "Get admin stats error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to load admin statistics",
      });
    }
  }
);

// =====================================================
// GET ALL USERS
// ADMIN ONLY
// =====================================================
router.get(
  "/users",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const users = await User.find({})
        .select(
          "-password -passwordResetToken -passwordResetExpires"
        )
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      console.error(
        "Get admin users error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to load users",
      });
    }
  }
);

// =====================================================
// UPDATE USER ROLE
// ADMIN ONLY
// =====================================================
router.patch(
  "/users/:userId/role",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { role } = req.body;

      const allowedRoles = [
        "buyer",
        "seller",
        "admin",
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user role",
        });
      }

      if (
        req.user.userId.toString() ===
        req.params.userId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot change your own admin role",
        });
      }

      const user = await User.findById(
        req.params.userId
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.role = role;

      await user.save();

      res.json({
        success: true,
        message: "User role updated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error(
        "Update user role error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to update user role",
      });
    }
  }
);

// =====================================================
// UPDATE USER STATUS
// ADMIN ONLY
// =====================================================
router.patch(
  "/users/:userId/status",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "active",
        "suspended",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user status",
        });
      }

      if (
        req.user.userId.toString() ===
        req.params.userId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot suspend your own account",
        });
      }

      const user = await User.findById(
        req.params.userId
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // =================================================
      // SUSPEND / REACTIVATE SELLER
      // =================================================
      if (user.role === "seller") {
        const seller = await Seller.findOne({
          user: user._id,
        });

        if (seller) {
          // ---------------------------------------------
          // SUSPEND SELLER
          // ---------------------------------------------
          if (status === "suspended") {
            const productUpdateResult =
              await Product.updateMany(
                {
                  seller: seller._id,
                  sellerSuspended: false,
                },
                {
                  $set: {
                    sellerSuspended: true,
                  },
                }
              );

            console.log(
              `Hidden ${productUpdateResult.modifiedCount} products belonging to suspended seller ${seller._id}`
            );
          }

          // ---------------------------------------------
          // REACTIVATE SELLER
          // ---------------------------------------------
          if (status === "active") {
            const productUpdateResult =
              await Product.updateMany(
                {
                  seller: seller._id,
                  sellerSuspended: true,
                },
                {
                  $set: {
                    sellerSuspended: false,
                  },
                }
              );

            console.log(
              `Restored ${productUpdateResult.modifiedCount} products belonging to reactivated seller ${seller._id}`
            );
          }
        }
      }

      user.status = status;

      await user.save();

      res.json({
        success: true,
        message:
          status === "suspended"
            ? "User suspended successfully"
            : "User activated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error(
        "Update user status error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to update user status",
      });
    }
  }
);

// =====================================================
// DELETE USER
// ADMIN ONLY
// =====================================================
router.delete(
  "/users/:userId",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      if (
        req.user.userId.toString() ===
        req.params.userId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot delete your own admin account",
        });
      }

      const user = await User.findById(
        req.params.userId
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // =================================================
      // DELETE SELLER'S PRODUCTS AND SELLER PROFILE
      // =================================================
      if (user.role === "seller") {
        const seller = await Seller.findOne({
          user: user._id,
        });

        if (seller) {
          const productDeleteResult =
            await Product.deleteMany({
              seller: seller._id,
            });

          console.log(
            `Deleted ${productDeleteResult.deletedCount} products belonging to deleted seller ${seller._id}`
          );

          await Seller.findByIdAndDelete(
            seller._id
          );
        }
      }

      // =================================================
      // DELETE USER
      // =================================================
      await User.findByIdAndDelete(
        req.params.userId
      );

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete admin user error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to delete user",
      });
    }
  }
);


// =====================================================
// PREVIEW ORDER REFUND
// ADMIN ONLY
// NO MONEY IS MOVED
// =====================================================
router.get(
  "/refunds/preview/:orderId",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const mongoose = require("mongoose");

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.orderId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }

      const order = await Order.findById(
        req.params.orderId
      ).select(
        "_id orderNumber buyer total paymentStatus paymentReference"
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      const payment = await Payment.findOne({
        order: order._id,
      }).select(
        "_id reference amount currency status refundedAmount"
      );

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment record not found",
        });
      }

      const alreadyRefunded =
        Number(payment.refundedAmount || 0);

      const refundableAmount =
        Number(payment.amount) -
        alreadyRefunded;

      return res.status(200).json({
        success: true,
        refundPreview: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentReference:
            payment.reference,
          paymentAmount:
            payment.amount,
          currency:
            payment.currency,
          paymentStatus:
            payment.status,
          alreadyRefunded,
          refundableAmount:
            Math.max(refundableAmount, 0),
        },
      });
    } catch (error) {
      console.error(
        "Refund preview error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to preview refund",
      });
    }
  }
);

// =====================================================
// PROCESS ORDER REFUND
// ADMIN ONLY
// =====================================================
router.post(
  "/refunds/process",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const {
        orderId,
        amount,
        reason = "",
      } = req.body;

      // =================================================
      // VALIDATE ORDER ID
      // =================================================
      if (
        !orderId ||
        !require("mongoose").Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }

      // =================================================
      // VALIDATE AMOUNT
      // =================================================
      const refundAmount = Number(amount);

      if (
        !Number.isFinite(refundAmount) ||
        refundAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Refund amount must be greater than zero",
        });
      }

      // =================================================
      // FIND ORDER
      // =================================================
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // =================================================
      // ORDER MUST BE PAID
      // =================================================
      if (order.paymentStatus !== "paid") {
        return res.status(400).json({
          success: false,
          message:
            "Only paid orders can be refunded",
        });
      }

      // =================================================
      // FIND PAYMENT
      // =================================================
      const payment = await Payment.findOne({
        order: order._id,
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message:
            "Payment record not found",
        });
      }

      // =================================================
      // PAYMENT MUST BE SUCCESSFUL
      // =================================================
      if (payment.status !== "successful") {
        return res.status(400).json({
          success: false,
          message:
            "Only successful payments can be refunded",
        });
      }

      // =================================================
      // CALCULATE REMAINING REFUNDABLE AMOUNT
      // =================================================
      const alreadyRefunded =
        Number(payment.refundedAmount || 0);

      const refundableAmount =
        Number(payment.amount) -
        alreadyRefunded;

      if (refundableAmount <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "This payment has already been fully refunded",
        });
      }

      if (refundAmount > refundableAmount) {
        return res.status(400).json({
          success: false,
          message: `Maximum refundable amount is ₦${refundableAmount.toFixed(
            2
          )}`,
        });
      }

      // =================================================
      // PREVENT DUPLICATE ACTIVE REFUND
      // =================================================
      const existingRefund =
        await Refund.findOne({
          payment: payment._id,
          status: {
            $in: [
              "pending",
              "processing",
            ],
          },
        });

      if (existingRefund) {
        return res.status(409).json({
          success: false,
          message:
            "A refund is already being processed for this payment",
          refund: existingRefund,
        });
      }

      // =================================================
      // CREATE REFUND RECORD
      // =================================================
      const refundReference =
        `VENDORA-REF-${Date.now()}-${Math.floor(
          Math.random() * 100000
        )}`;

      const refund =
        await Refund.create({
          order: order._id,
          payment: payment._id,
          buyer: order.buyer,
          reference: refundReference,
          paystackReference:
            payment.reference,
          amount: refundAmount,
          currency: payment.currency || "NGN",
          reason: reason.trim(),
          status: "processing",
        });

      // =================================================
      // SEND REFUND TO PAYSTACK
      // =================================================
      try {
        const paystackResult =
          await refundTransaction({
            transactionReference:
              payment.reference,
            amount: refundAmount,
          });

        // =================================================
        // UPDATE REFUND RECORD
        // =================================================
        refund.status = "successful";

        refund.paystackRefundId =
          paystackResult?.data?.id
            ? String(
                paystackResult.data.id
              )
            : "";

        refund.paystackResponse =
          paystackResult.data || null;

        refund.processedAt =
          new Date();

        refund.completedAt =
          new Date();

        await refund.save();

        // =================================================
        // UPDATE PAYMENT REFUNDED AMOUNT
        // =================================================
        payment.refundedAmount =
          alreadyRefunded +
          refundAmount;

        payment.refundReference =
          refund.reference;

        payment.refundedAt =
          new Date();

        if (
          payment.refundedAmount >=
          Number(payment.amount)
        ) {
          payment.status = "refunded";
        } else {
          payment.status =
            "partially_refunded";
        }

        await payment.save();

        // =================================================
        // UPDATE ORDER PAYMENT STATUS
        // =================================================
        if (
          payment.refundedAmount >=
          Number(payment.amount)
        ) {
          order.paymentStatus =
            "refunded";
        }

        await order.save();

        return res.status(200).json({
          success: true,
          message:
            "Refund processed successfully",
          refund: {
            id: refund._id,
            reference:
              refund.reference,
            amount:
              refund.amount,
            status:
              refund.status,
          },
          payment: {
            id: payment._id,
            refundedAmount:
              payment.refundedAmount,
            status:
              payment.status,
          },
          order: {
            id: order._id,
            paymentStatus:
              order.paymentStatus,
          },
        });
      } catch (paystackError) {
        // =================================================
        // PAYSTACK REFUND FAILED
        // =================================================
        refund.status = "failed";

        refund.failureReason =
          paystackError.message ||
          "Paystack refund failed";

        refund.failedAt =
          new Date();

        await refund.save();

        return res.status(502).json({
          success: false,
          message:
            "Paystack refund failed",
          error:
            paystackError.message,
          refund: {
            id: refund._id,
            reference:
              refund.reference,
            status:
              refund.status,
          },
        });
      }
    } catch (error) {
      console.error(
        "Process admin refund error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to process refund",
      });
    }
  }
);


// =====================================================
// PROCESS ORDER REFUND
// ADMIN ONLY
// =====================================================
router.post(
  "/refunds/process",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const {
        orderId,
        amount,
        reason = "",
      } = req.body;

      // =================================================
      // VALIDATE ORDER ID
      // =================================================
      if (
        !orderId ||
        !require("mongoose").Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }

      // =================================================
      // VALIDATE AMOUNT
      // =================================================
      const refundAmount = Number(amount);

      if (
        !Number.isFinite(refundAmount) ||
        refundAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Refund amount must be greater than zero",
        });
      }

      // =================================================
      // FIND ORDER
      // =================================================
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // =================================================
      // CHECK PAYMENT STATUS
      // =================================================
      if (order.paymentStatus !== "paid") {
        return res.status(400).json({
          success: false,
          message:
            "Only paid orders can be refunded",
        });
      }

      // =================================================
      // FIND PAYMENT
      // =================================================
      const payment = await Payment.findOne({
        order: order._id,
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message:
            "Payment record not found",
        });
      }

      // =================================================
      // CHECK PAYMENT STATUS
      // =================================================
      if (payment.status !== "successful") {
        return res.status(400).json({
          success: false,
          message:
            "Only successful payments can be refunded",
        });
      }

      // =================================================
      // CALCULATE REMAINING REFUNDABLE AMOUNT
      // =================================================
      const alreadyRefunded =
        Number(payment.refundedAmount || 0);

      const refundableAmount =
        Number(payment.amount) -
        alreadyRefunded;

      if (refundableAmount <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "This payment has already been fully refunded",
        });
      }

      if (refundAmount > refundableAmount) {
        return res.status(400).json({
          success: false,
          message: `Maximum refundable amount is ₦${refundableAmount.toFixed(
            2
          )}`,
        });
      }

      // =================================================
      // PREVENT DUPLICATE ACTIVE REFUND
      // =================================================
      const existingRefund =
        await Refund.findOne({
          payment: payment._id,
          status: {
            $in: [
              "pending",
              "processing",
            ],
          },
        });

      if (existingRefund) {
        return res.status(409).json({
          success: false,
          message:
            "A refund is already being processed for this payment",
          refund: existingRefund,
        });
      }

      // =================================================
      // CREATE INTERNAL REFUND RECORD
      // =================================================
      const refundReference =
        `VENDORA-REF-${Date.now()}-${Math.floor(
          Math.random() * 100000
        )}`;

      const refund =
        await Refund.create({
          order: order._id,
          payment: payment._id,
          buyer: order.buyer,
          reference: refundReference,
          paystackReference:
            payment.reference,
          amount: refundAmount,
          currency:
            payment.currency || "NGN",
          reason: reason.trim(),
          status: "processing",
        });

      // =================================================
      // SEND REFUND REQUEST TO PAYSTACK
      // =================================================
      try {
        const paystackResult =
          await refundTransaction({
            transactionReference:
              payment.reference,
            amount: refundAmount,
          });

        // =================================================
        // SAVE PAYSTACK RESPONSE
        // IMPORTANT:
        // THIS DOES NOT MEAN THE REFUND IS COMPLETED.
        // =================================================
        refund.status = "processing";

        refund.paystackRefundId =
          paystackResult?.data?.id
            ? String(
                paystackResult.data.id
              )
            : "";

        refund.paystackResponse =
          paystackResult.data || null;

        refund.processedAt =
          new Date();

        await refund.save();

        // =================================================
        // DO NOT UPDATE PAYMENT YET
        // DO NOT UPDATE ORDER YET
        // DO NOT UPDATE SELLER EARNINGS YET
        //
        // Those updates will happen only after Paystack
        // confirms the refund has actually been processed.
        // =================================================
        return res.status(202).json({
          success: true,
          message:
            "Refund request submitted and is being processed",
          refund: {
            id: refund._id,
            reference:
              refund.reference,
            amount:
              refund.amount,
            status:
              refund.status,
            paystackRefundId:
              refund.paystackRefundId,
          },
          payment: {
            id: payment._id,
            refundedAmount:
              alreadyRefunded,
            status:
              payment.status,
          },
          order: {
            id: order._id,
            paymentStatus:
              order.paymentStatus,
          },
        });
      } catch (paystackError) {
        // =================================================
        // PAYSTACK REFUND REQUEST FAILED
        // =================================================
        refund.status = "failed";

        refund.failureReason =
          paystackError.message ||
          "Paystack refund failed";

        refund.failedAt =
          new Date();

        await refund.save();

        return res.status(502).json({
          success: false,
          message:
            "Paystack refund failed",
          error:
            paystackError.message,
          refund: {
            id: refund._id,
            reference:
              refund.reference,
            status:
              refund.status,
          },
        });
      }
    } catch (error) {
      console.error(
        "Process admin refund error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to process refund",
      });
    }
  }
);

module.exports = router;