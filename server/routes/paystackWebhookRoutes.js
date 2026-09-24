const express = require("express");
const crypto = require("crypto");

const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Refund = require("../models/Refund");
const SellerEarning = require("../models/SellerEarning");
const Withdrawal = require("../models/Withdrawal");

const router = express.Router();

// =====================================================
// VERIFY PAYSTACK WEBHOOK SIGNATURE
// =====================================================
const verifyPaystackSignature = (req) => {
  const signature = req.headers["x-paystack-signature"];

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

  const hashBuffer = Buffer.from(hash, "utf8");
  const signatureBuffer = Buffer.from(
    String(signature),
    "utf8"
  );

  if (
    hashBuffer.length !==
    signatureBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    hashBuffer,
    signatureBuffer
  );
};

// =====================================================
// RELEASE WITHDRAWAL EARNINGS
//
// Used when Paystack transfer fails or is reversed.
// Reserved earnings become available again.
// =====================================================
const releaseWithdrawalEarnings = async (
  withdrawalId
) => {
  const earnings = await SellerEarning.find({
    withdrawal: withdrawalId,
    status: "withdrawal_pending",
  });

  for (const earning of earnings) {
    earning.reservedAmount = 0;
    earning.withdrawal = null;

    const remainingAmount = Math.max(
      0,
      Number(earning.netAmount || 0) -
        Number(earning.withdrawnAmount || 0) -
        Number(earning.refundedAmount || 0)
    );

    if (remainingAmount > 0) {
      earning.status = "available";
    } else if (
      Number(earning.refundedAmount || 0) >=
      Number(earning.netAmount || 0)
    ) {
      earning.status = "refunded";
    }

    await earning.save();
  }
};

// =====================================================
// COMPLETE SUCCESSFUL WITHDRAWAL
//
// Moves reserved earnings into withdrawnAmount.
// =====================================================
const completeWithdrawalEarnings = async (
  withdrawalId
) => {
  const earnings = await SellerEarning.find({
    withdrawal: withdrawalId,
    status: "withdrawal_pending",
  });

  for (const earning of earnings) {
    const reserved = Number(
      earning.reservedAmount || 0
    );

    if (reserved <= 0) {
      continue;
    }

    earning.withdrawnAmount =
      Number(earning.withdrawnAmount || 0) +
      reserved;

    earning.reservedAmount = 0;

    const remainingAmount = Math.max(
      0,
      Number(earning.netAmount || 0) -
        Number(earning.withdrawnAmount || 0) -
        Number(earning.refundedAmount || 0)
    );

    if (remainingAmount > 0) {
      earning.status = "available";
    } else if (
      Number(earning.refundedAmount || 0) >=
      Number(earning.netAmount || 0)
    ) {
      earning.status = "refunded";
    } else {
      earning.status = "withdrawn";
    }


    await earning.save();
  }
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
    // SUPPORTED EVENTS
    // =================================================
    const supportedEvents = [
      // Refund events
      "refund.pending",
      "refund.processing",
      "refund.needs-attention",
      "refund.failed",
      "refund.processed",

      // Seller withdrawal events
      "transfer.success",
      "transfer.failed",
      "transfer.reversed",
    ];

    if (!supportedEvents.includes(event)) {
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
    // SELLER WITHDRAWAL / TRANSFER EVENTS
    // =================================================
    if (
      event === "transfer.success" ||
      event === "transfer.failed" ||
      event === "transfer.reversed"
    ) {
      const transferReference = data.reference
        ? String(data.reference)
        : "";

      const transferCode = data.transfer_code
        ? String(data.transfer_code)
        : "";

      if (
        !transferReference &&
        !transferCode
      ) {
        console.warn(
          "Transfer webhook has no reference or transfer code:",
          {
            event,
            data,
          }
        );

        return res.status(200).json({
          success: true,
          message:
            "Transfer webhook received without an identifiable transfer",
        });
      }

      // -----------------------------------------------
      // FIND WITHDRAWAL
      // -----------------------------------------------
      let withdrawal = null;

      if (transferReference) {
        withdrawal =
          await Withdrawal.findOne({
            transferReference,
          });
      }

      if (
        !withdrawal &&
        transferCode
      ) {
        withdrawal =
          await Withdrawal.findOne({
            transferCode,
          });
      }

      if (!withdrawal) {
        console.warn(
          "Vendora withdrawal not found for Paystack transfer webhook:",
          {
            event,
            transferReference,
            transferCode,
          }
        );

        return res.status(200).json({
          success: true,
          message:
            "Transfer webhook received but withdrawal was not found",
        });
      }

      // -----------------------------------------------
      // SAVE PAYSTACK RESPONSE
      // -----------------------------------------------
      withdrawal.paystackResponse =
        data || null;

      if (transferReference) {
        withdrawal.transferReference =
          transferReference;
      }

      if (transferCode) {
        withdrawal.transferCode =
          transferCode;
      }

      // =================================================
      // TRANSFER SUCCESS
      // =================================================
      if (
        event === "transfer.success"
      ) {
        // ---------------------------------------------
        // PREVENT DUPLICATE SUCCESS ACCOUNTING
        // ---------------------------------------------
        if (
          withdrawal.status ===
            "successful" &&
          withdrawal.completedAt
        ) {
          return res.status(200).json({
            success: true,
            message:
              "Withdrawal already completed",
          });
        }

        withdrawal.status =
          "successful";

        withdrawal.processedAt =
          withdrawal.processedAt ||
          new Date();

        withdrawal.completedAt =
          new Date();

        withdrawal.failureReason = "";

        await withdrawal.save();

        // ---------------------------------------------
        // MOVE RESERVED MONEY TO WITHDRAWN
        // ---------------------------------------------
        await completeWithdrawalEarnings(
          withdrawal._id
        );

        console.log(
          "Vendora seller withdrawal completed successfully:",
          {
            withdrawalId:
              withdrawal._id,
            seller:
              withdrawal.seller,
            amount:
              withdrawal.amount,
            transferReference:
              withdrawal.transferReference,
            transferCode:
              withdrawal.transferCode,
          }
        );

        return res.status(200).json({
          success: true,
          message:
            "Seller withdrawal marked successful",
        });
      }

      // =================================================
      // TRANSFER FAILED
      // =================================================
      if (
        event === "transfer.failed"
      ) {
        // ---------------------------------------------
        // DUPLICATE FAILED EVENT
        // ---------------------------------------------
        if (
          withdrawal.status ===
            "failed" &&
          withdrawal.failedAt
        ) {
          return res.status(200).json({
            success: true,
            message:
              "Withdrawal failure already recorded",
          });
        }

        withdrawal.status =
          "failed";

        withdrawal.failureReason =
          data.reason ||
          data.message ||
          data.failure_reason ||
          "Paystack transfer failed";

        withdrawal.processedAt =
          withdrawal.processedAt ||
          new Date();

        withdrawal.failedAt =
          new Date();

        await withdrawal.save();

        // ---------------------------------------------
        // RETURN RESERVED MONEY TO SELLER
        // ---------------------------------------------
        await releaseWithdrawalEarnings(
          withdrawal._id
        );

        console.warn(
          "Vendora seller withdrawal failed:",
          {
            withdrawalId:
              withdrawal._id,
            seller:
              withdrawal.seller,
            amount:
              withdrawal.amount,
            reason:
              withdrawal.failureReason,
          }
        );

        return res.status(200).json({
          success: true,
          message:
            "Seller withdrawal failure recorded",
        });
      }

      // =================================================
      // TRANSFER REVERSED
      // =================================================
      if (
        event === "transfer.reversed"
      ) {
        /*
         * A successful Paystack transfer can later
         * be reversed.
         *
         * If the withdrawal had already been completed,
         * return the withdrawn amount back into the
         * seller's available earnings.
         *
         * If it was still processing, release the
         * reserved earnings.
         */

        // ---------------------------------------------
        // PREVENT DUPLICATE REVERSAL PROCESSING
        // ---------------------------------------------
        if (
          withdrawal.status === "failed" &&
          withdrawal.failedAt
        ) {
          return res.status(200).json({
            success: true,
            message:
              "Withdrawal reversal already recorded",
          });
        }

        // ---------------------------------------------
        // PREVIOUSLY SUCCESSFUL WITHDRAWAL
        // ---------------------------------------------
        if (
          withdrawal.status ===
          "successful"
        ) {
          const earnings =
            await SellerEarning.find({
              seller: withdrawal.seller,
              withdrawal:
                withdrawal._id,
            });

          let remainingToReturn =
            Number(
              withdrawal.amount || 0
            );

          for (
            const earning of earnings
          ) {
            if (
              remainingToReturn <= 0
            ) {
              break;
            }

            const withdrawnAmount =
              Number(
                earning.withdrawnAmount ||
                  0
              );

            if (
              withdrawnAmount <= 0
            ) {
              continue;
            }

            const amountToReturn =
              Math.min(
                withdrawnAmount,
                remainingToReturn
              );

            earning.withdrawnAmount =
              Math.max(
                0,
                withdrawnAmount -
                  amountToReturn
              );

            remainingToReturn =
              Math.max(
                0,
                remainingToReturn -
                  amountToReturn
              );

            const netAmount =
              Number(
                earning.netAmount ||
                  0
              );

            const refundedAmount =
              Number(
                earning.refundedAmount ||
                  0
              );

            const stillAvailable =
              Math.max(
                0,
                netAmount -
                  Number(
                    earning.withdrawnAmount ||
                      0
                  ) -
                  refundedAmount
              );

            if (
              refundedAmount >=
              netAmount
            ) {
              earning.status =
                "refunded";
            } else if (
              stillAvailable > 0
            ) {
              earning.status =
                "available";
            } else {
              earning.status =
                "withdrawn";
            }

            await earning.save();
          }

          if (
            remainingToReturn > 0
          ) {
            console.error(
              "Withdrawal reversal could not fully restore withdrawn earnings:",
              {
                withdrawalId:
                  withdrawal._id,
                remainingToReturn,
              }
            );
          }
        } else {
          // -------------------------------------------
          // WITHDRAWAL STILL PROCESSING
          // -------------------------------------------
          await releaseWithdrawalEarnings(
            withdrawal._id
          );
        }

        // ---------------------------------------------
        // MARK WITHDRAWAL AS FAILED / REVERSED
        // ---------------------------------------------
        withdrawal.status =
          "failed";

        withdrawal.failureReason =
          data.reason ||
          data.message ||
          data.failure_reason ||
          "Paystack transfer was reversed";

        withdrawal.processedAt =
          withdrawal.processedAt ||
          new Date();

        withdrawal.failedAt =
          new Date();

        await withdrawal.save();

        console.warn(
          "Vendora seller withdrawal reversed:",
          {
            withdrawalId:
              withdrawal._id,

            seller:
              withdrawal.seller,

            amount:
              withdrawal.amount,

            reason:
              withdrawal.failureReason,
          }
        );

        return res.status(200).json({
          success: true,
          message:
            "Seller withdrawal reversal recorded",
        });
      }

      // =================================================
      // IMPORTANT:
      // CLOSE SELLER TRANSFER EVENT BLOCK
      // =================================================
    }

    // =================================================
    // REFUND EVENTS
    // =================================================

    // =================================================
    // FIND REFUND
    // =================================================
    let refund = null;

    if (data.id) {
      refund =
        await Refund.findOne({
          paystackRefundId:
            String(data.id),
        });
    }

    if (
      !refund &&
      data.transaction
    ) {
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
    if (
      event === "refund.pending"
    ) {
      refund.status =
        "pending";

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
      refund.status =
        "processing";

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
      refund.status =
        "processing";

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
    if (
      event === "refund.failed"
    ) {
      refund.status =
        "failed";

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
    // ONLY HERE DO WE UPDATE:
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
          payment.refundedAmount ||
            0
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

        for (
          const earning of earnings
        ) {
          const grossAmount =
            Number(
              earning.grossAmount ||
                0
            );

          const netAmount =
            Number(
              earning.netAmount ||
                0
            );

          if (
            grossAmount <= 0 ||
            netAmount <= 0 ||
            orderAmount <= 0
          ) {
            continue;
          }

          // -------------------------------------------
          // ALLOCATE REFUND PROPORTIONALLY
          // -------------------------------------------
          const sellerRefundGross =
            refundAmount *
            (
              grossAmount /
              Number(
                order.subtotal ||
                  orderAmount
              )
            );

          // -------------------------------------------
          // CONVERT GROSS REFUND TO NET EARNING
          // -------------------------------------------
          const sellerRefundNet =
            Math.min(
              netAmount -
                Number(
                  earning.refundedAmount ||
                    0
                ),
              sellerRefundGross *
                (
                  netAmount /
                  grossAmount
                )
            );

          if (
            sellerRefundNet <= 0
          ) {
            continue;
          }

          earning.refundedAmount =
            Number(
              earning.refundedAmount ||
                0
            ) +
            sellerRefundNet;

          const remainingSellerAmount =
            Math.max(
              netAmount -
                earning.refundedAmount -
                Number(
                  earning.withdrawnAmount ||
                    0
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

          // -------------------------------------------
          // PREVENT RESERVED MONEY FROM BECOMING
          // AVAILABLE AFTER REFUND
          // -------------------------------------------
          if (
            Number(
              earning.reservedAmount ||
                0
            ) >
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
      "Paystack webhook error:",
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