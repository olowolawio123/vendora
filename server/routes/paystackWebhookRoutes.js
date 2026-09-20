const express = require("express");
const crypto = require("crypto");

const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Refund = require("../models/Refund");
const SellerEarning = require("../models/SellerEarning");

const router = express.Router();

// =====================================================
// VERIFY PAYSTACK WEBHOOK SIGNATURE
// =====================================================
const verifyPaystackSignature = (req) => {
  const signature =
    req.headers["x-paystack-signature"];

  if (!signature || !req.rawBody) {
    return false;
  }

  const hash = crypto
    .createHmac(
      "sha512",
      process.env.PAYSTACK_SECRET_KEY
    )
    .update(req.rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(signature)
  );
};

// =====================================================
// PAYSTACK WEBHOOK
// =====================================================
router.post("/", async (req, res) => {
  try {
    // =================================================
    // VERIFY SIGNATURE
    // =================================================
    if (!verifyPaystackSignature(req)) {
      console.warn(
        "Rejected invalid Paystack webhook signature"
      );

      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = req.body?.event;
    const data = req.body?.data;

    console.log(
      "Paystack webhook received:",
      event
    );

    // =================================================
    // IGNORE EVENTS WE DO NOT HANDLE
    // =================================================
    if (
      ![
        "refund.pending",
        "refund.processing",
        "refund.needs-attention",
        "refund.failed",
        "refund.processed",
      ].includes(event)
    ) {
      return res.status(200).json({
        success: true,
        message: "Event received",
      });
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Webhook data is missing",
      });
    }

    // =================================================
    // FIND REFUND
    //
    // We primarily use Paystack's refund ID.
    // If unavailable, fall back to the transaction
    // reference stored in Vendora.
    // =================================================
    let refund = null;

    if (data.id) {
      refund =
        await Refund.findOne({
          paystackRefundId: String(
            data.id
          ),
        });
    }

    if (!refund && data.transaction) {
      const transactionReference =
        typeof data.transaction ===
        "object"
          ? data.transaction.reference
          : data.transaction;

      if (transactionReference) {
        refund =
          await Refund.findOne({
            paystackReference:
              transactionReference,
            status: {
              $in: [
                "pending",
                "processing",
              ],
          },
        });
      }
    }

    if (!refund) {
      console.warn(
        "Vendora refund record not found for Paystack webhook:",
        {
          event,
          refundId: data.id,
          transaction:
            data.transaction,
        }
      );

      // Return 200 so Paystack does not repeatedly retry
      // an event that Vendora cannot associate.
      return res.status(200).json({
        success: true,
        message:
          "Webhook received but refund record was not found",
      });
    }

    // =================================================
    // SAVE PAYSTACK RESPONSE
    // =================================================
    refund.paystackResponse =
      data || null;

    if (data.id) {
      refund.paystackRefundId =
        String(data.id);
    }

    // =================================================
    // REFUND PENDING
    // =================================================
    if (event === "refund.pending") {
      refund.status = "pending";

      await refund.save();

      return res.status(200).json({
        success: true,
        message:
          "Refund pending status recorded",
      });
    }

    // =================================================
    // REFUND PROCESSING
    // =================================================
    if (
      event === "refund.processing"
    ) {
      refund.status = "processing";

      await refund.save();

      return res.status(200).json({
        success: true,
        message:
          "Refund processing status recorded",
      });
    }

    // =================================================
    // REFUND NEEDS ATTENTION
    // =================================================
    if (
      event ===
      "refund.needs-attention"
    ) {
      refund.status = "processing";

      refund.failureReason =
        data.failure_reason ||
        data.message ||
        "Paystack requires attention for this refund";

      await refund.save();

      return res.status(200).json({
        success: true,
        message:
          "Refund needs attention status recorded",
      });
    }

    // =================================================
    // REFUND FAILED
    // =================================================
    if (event === "refund.failed") {
      refund.status = "failed";

      refund.failureReason =
        data.failure_reason ||
        data.message ||
        "Paystack refund failed";

      refund.failedAt =
        new Date();

      await refund.save();

      return res.status(200).json({
        success: true,
        message:
          "Refund failure recorded",
      });
    }

    // =================================================
    // REFUND PROCESSED
    //
    // THIS IS THE IMPORTANT EVENT.
    //
    // Only here do we update:
    // - Refund
    // - Payment
    // - Order
    // - SellerEarning
    // =================================================
    if (
      event === "refund.processed"
    ) {
      // -----------------------------------------------
      // PREVENT DUPLICATE ACCOUNTING
      // -----------------------------------------------
      if (
        refund.status ===
          "successful" &&
        refund.completedAt
      ) {
        return res.status(200).json({
          success: true,
          message:
            "Refund already processed",
        });
      }

      // -----------------------------------------------
      // FIND PAYMENT
      // -----------------------------------------------
      const payment =
        await Payment.findById(
          refund.payment
        );

      if (!payment) {
        console.error(
          "Payment not found for refund:",
          refund._id
        );

        return res.status(200).json({
          success: true,
          message:
            "Refund received but payment was not found",
        });
      }

      // -----------------------------------------------
      // FIND ORDER
      // -----------------------------------------------
      const order =
        await Order.findById(
          refund.order
        );

      if (!order) {
        console.error(
          "Order not found for refund:",
          refund._id
        );

        return res.status(200).json({
          success: true,
          message:
            "Refund received but order was not found",
        });
      }

      const refundAmount =
        Number(refund.amount);

      const previousRefundedAmount =
        Number(
          payment.refundedAmount || 0
        );

      // -----------------------------------------------
      // PROTECT AGAINST DUPLICATE WEBHOOK ACCOUNTING
      // -----------------------------------------------
      const newRefundedAmount =
        Math.min(
          previousRefundedAmount +
            refundAmount,
          Number(payment.amount)
        );

      // -----------------------------------------------
      // UPDATE REFUND
      // -----------------------------------------------
      refund.status =
        "successful";

      refund.processedAt =
        refund.processedAt ||
        new Date();

      refund.completedAt =
        new Date();

      await refund.save();

      // -----------------------------------------------
      // UPDATE PAYMENT
      // -----------------------------------------------
      payment.refundedAmount =
        newRefundedAmount;

      payment.refundReference =
        refund.reference;

      payment.refundedAt =
        new Date();

      if (
        newRefundedAmount >=
        Number(payment.amount)
      ) {
        payment.status =
          "refunded";
      } else {
        payment.status =
          "partially_refunded";
      }

      await payment.save();

      // -----------------------------------------------
      // UPDATE ORDER
      // -----------------------------------------------
      if (
        newRefundedAmount >=
        Number(payment.amount)
      ) {
        order.paymentStatus =
          "refunded";
      }

      await order.save();

      // -----------------------------------------------
      // UPDATE SELLER EARNINGS
      //
      // Refund is allocated proportionally against
      // each seller earning belonging to this order.
      // -----------------------------------------------
      const earnings =
        await SellerEarning.find({
          order: order._id,
        });

      if (earnings.length > 0) {
        const orderAmount =
          Number(payment.amount);

        for (const earning of earnings) {
          const grossAmount =
            Number(
              earning.grossAmount || 0
            );

          const netAmount =
            Number(
              earning.netAmount || 0
            );

          if (
            grossAmount <= 0 ||
            netAmount <= 0 ||
            orderAmount <= 0
          ) {
            continue;
          }

          // -------------------------------------------
          // Allocate the customer's refund
          // proportionally to this seller's gross sale.
          // -------------------------------------------
          const sellerRefundGross =
            refundAmount *
            (grossAmount /
              Number(order.subtotal || orderAmount));

          // -------------------------------------------
          // Convert the gross refund into the seller's
          // net earning portion.
          // -------------------------------------------
          const sellerRefundNet =
            Math.min(
              netAmount -
                Number(
                  earning.refundedAmount || 0
                ),
              sellerRefundGross *
                (netAmount /
                  grossAmount)
            );

          if (
            sellerRefundNet <= 0
          ) {
            continue;
          }

          earning.refundedAmount =
            Number(
              earning.refundedAmount || 0
            ) +
            sellerRefundNet;

          const remainingSellerAmount =
            Math.max(
              netAmount -
                earning.refundedAmount -
                Number(
                  earning.withdrawnAmount || 0
                ),
              0
            );

          if (
            earning.refundedAmount >=
            netAmount
          ) {
            earning.status =
              "refunded";
          } else if (
            earning.status !==
              "withdrawn" &&
            earning.status !==
              "withdrawal_pending"
          ) {
            earning.status =
              "partially_refunded";
          }

          // Prevent reserved money from becoming
          // available after a refund.
          if (
            earning.reservedAmount >
            remainingSellerAmount
          ) {
            earning.reservedAmount =
              remainingSellerAmount;
          }

          await earning.save();
        }
      }

      console.log(
        "Paystack refund processed successfully:",
        {
          refundId:
            refund._id,
          paymentId:
            payment._id,
          orderId:
            order._id,
          amount:
            refundAmount,
        }
      );

      return res.status(200).json({
        success: true,
        message:
          "Refund processed and Vendora accounting updated",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Refund webhook handled",
    });
  } catch (error) {
    console.error(
      "Paystack refund webhook error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Webhook processing error",
    });
  }
});

module.exports = router;