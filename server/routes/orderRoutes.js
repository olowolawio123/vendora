const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const Seller = require("../models/Seller");
const Payment = require("../models/Payment");
const SellerEarning = require("../models/SellerEarning");
const protect = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");
const Withdrawal = require("../models/Withdrawal");
const Coupon = require("../models/Coupon");

const {
  createTransfer,
} = require("../services/paystackTransferService");

const router = express.Router();

/*
  SELLER PAYOUT - GET BANKS

  GET /api/orders/seller-payout/banks
*/
router.get(
  "/seller-payout/banks",
  protect,
  async (req, res) => {
    try {
      if (!process.env.PAYSTACK_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message:
            "Paystack is not configured on the server",
        });
      }

      const seller = await Seller.findOne({
        user: req.user.userId,
        status: "approved",
      });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers can manage payout information",
        });
      }

      const paystackResponse = await fetch(
        "https://api.paystack.co/bank?currency=NGN&perPage=100",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const paystackData =
        await paystackResponse.json();

      if (
        !paystackResponse.ok ||
        !paystackData.status
      ) {
        console.error(
          "Paystack bank list error:",
          paystackData
        );

        return res.status(400).json({
          success: false,
          message:
            paystackData.message ||
            "Unable to load banks",
        });
      }

      const banks = (paystackData.data || [])
        .filter(
          (bank) =>
            bank.active &&
            !bank.is_deleted &&
            bank.currency === "NGN"
        )
        .map((bank) => ({
          name: bank.name,
          code: bank.code,
        }));

      return res.json({
        success: true,
        banks,
      });
    } catch (error) {
      console.error(
        "Get seller payout banks error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load banks",
      });
    }
  }
);

/*
  SELLER PAYOUT - GET SAVED PAYOUT ACCOUNT

  GET /api/orders/seller-payout
*/
router.get(
  "/seller-payout",
  protect,
  async (req, res) => {
    try {
      const seller = await Seller.findOne({
        user: req.user.userId,
        status: "approved",
      });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers can manage payout information",
        });
      }

      const payout = seller.payout;

      if (
        !payout ||
        !payout.bankCode ||
        !payout.accountNumber
      ) {
        return res.json({
          success: true,
          payout: null,
        });
      }

      return res.json({
        success: true,
        payout: {
          bankCode: payout.bankCode || "",
          bankName: payout.bankName || "",
          accountNumber:
            payout.accountNumber || "",
          accountName:
            payout.accountName || "",
          verified:
            Boolean(payout.verified),
          verifiedAt:
            payout.verifiedAt || null,
        },
      });
    } catch (error) {
      console.error(
        "Get seller payout account error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load payout account",
      });
    }
  }
);

/*
  SELLER PAYOUT - VERIFY BANK ACCOUNT

  POST /api/orders/seller-payout/verify
*/
router.post(
  "/seller-payout/verify",
  protect,
  async (req, res) => {
    try {
      const {
        bankCode,
        bankName,
        accountNumber,
      } = req.body;

      if (
        !bankCode ||
        !accountNumber
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Bank and account number are required",
        });
      }

      const cleanBankCode =
        String(bankCode).trim();

      const cleanAccountNumber =
        String(accountNumber).trim();

      if (
        !/^\d+$/.test(
          cleanAccountNumber
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Account number must contain only numbers",
        });
      }

      if (
        cleanAccountNumber.length < 10
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Enter a valid Nigerian bank account number",
        });
      }

      if (!process.env.PAYSTACK_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message:
            "Paystack is not configured on the server",
        });
      }

      const seller = await Seller.findOne({
        user: req.user.userId,
        status: "approved",
      });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers can manage payout information",
        });
      }

      const resolveUrl =
        `https://api.paystack.co/bank/resolve` +
        `?account_number=${encodeURIComponent(
          cleanAccountNumber
        )}` +
        `&bank_code=${encodeURIComponent(
          cleanBankCode
        )}`;

      const resolveResponse = await fetch(
        resolveUrl,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const resolveData =
        await resolveResponse.json();

      if (
        !resolveResponse.ok ||
        !resolveData.status
      ) {
        console.error(
          "Paystack account resolution error:",
          resolveData
        );

        return res.status(400).json({
          success: false,
          message:
            resolveData.message ||
            "Unable to verify this bank account",
        });
      }

      const accountName =
        resolveData.data?.account_name || "";

      if (!accountName) {
        return res.status(400).json({
          success: false,
          message:
            "Unable to retrieve the bank account name",
        });
      }

      const recipientResponse =
        await fetch(
          "https://api.paystack.co/transferrecipient",
          {
            method: "POST",

            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              type: "nuban",
              name: accountName,
              account_number:
                cleanAccountNumber,
              bank_code:
                cleanBankCode,
              currency: "NGN",
            }),
          }
        );

      const recipientData =
        await recipientResponse.json();

      if (
        !recipientResponse.ok ||
        !recipientData.status
      ) {
        console.error(
          "Paystack recipient creation error:",
          recipientData
        );

        return res.status(400).json({
          success: false,
          message:
            recipientData.message ||
            "Unable to create payout recipient",
        });
      }

      const recipient =
        recipientData.data;

      seller.payout = {
        bankCode: cleanBankCode,

        bankName:
          bankName ||
          recipient.details?.bank_name ||
          "",

        accountNumber:
          cleanAccountNumber,

        accountName,

        paystackRecipientCode:
          recipient.recipient_code,

        verified: true,

        verifiedAt: new Date(),
      };

      await seller.save();

      return res.json({
        success: true,
        message:
          "Bank account verified successfully",

        payout: {
          bankCode:
            seller.payout.bankCode,

          bankName:
            seller.payout.bankName,

          accountNumber:
            seller.payout.accountNumber,

          accountName:
            seller.payout.accountName,

          verified:
            seller.payout.verified,

          verifiedAt:
            seller.payout.verifiedAt,
        },
      });
    } catch (error) {
      console.error(
        "Verify seller payout account error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify bank account",
      });
    }
  }
);

/*
  SELLER WITHDRAWAL - BALANCE

  GET /api/orders/seller-withdrawal/balance
*/
router.get(
  "/seller-withdrawal/balance",
  protect,
  async (req, res) => {
    try {
      const seller = await Seller.findOne({
        user: req.user.userId,
        status: "approved",
      });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers can view withdrawal balance",
        });
      }

      const availableEarnings =
        await SellerEarning.find({
          seller: seller._id,
          status: {
            $in: [
              "available",
              "withdrawal_pending",
            ],
          },
        });

      const pendingEarnings =
        await SellerEarning.find({
          seller: seller._id,
          status: "withdrawal_pending",
        });

      const withdrawnEarnings =
        await SellerEarning.find({
          seller: seller._id,
          status: "withdrawn",
        });

      const availableAmount =
        availableEarnings.reduce(
          (total, earning) =>
            total +
            Math.max(
              0,
              Number(
                earning.netAmount || 0
              ) -
                Number(
                  earning.withdrawnAmount ||
                    0
                ) -
                Number(
                  earning.reservedAmount ||
                    0
                )
            ),
          0
        );

      const pendingWithdrawalAmount =
        pendingEarnings.reduce(
          (total, earning) =>
            total +
            Number(
              earning.reservedAmount || 0
            ),
          0
        );

      const withdrawnAmount =
        withdrawnEarnings.reduce(
          (total, earning) =>
            total +
            Number(
              earning.withdrawnAmount || 0
            ),
          0
        );

      const pendingWithdrawals =
        await Withdrawal.find({
          seller: seller._id,
          status: {
            $in: [
              "pending",
              "processing",
            ],
          },
        }).sort({
          createdAt: -1,
        });

      return res.json({
        success: true,

        balance: {
          available:
            Math.round(
              availableAmount * 100
            ) / 100,

          pendingWithdrawal:
            Math.round(
              pendingWithdrawalAmount * 100
            ) / 100,

          withdrawn:
            Math.round(
              withdrawnAmount * 100
            ) / 100,

          currency: "NGN",
        },

        payout: {
          bankName:
            seller.payout?.bankName || "",

          accountNumber:
            seller.payout?.accountNumber || "",

          accountName:
            seller.payout?.accountName || "",

          verified:
            seller.payout?.verified || false,
        },

        pendingWithdrawals,
      });
    } catch (error) {
      console.error(
        "Get seller withdrawal balance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load withdrawal balance",
      });
    }
  }
);

/*
  SELLER WITHDRAWAL - HISTORY

  GET /api/orders/seller-withdrawal/history
*/
router.get(
  "/seller-withdrawal/history",
  protect,
  async (req, res) => {
    try {
      const seller = await Seller.findOne({
        user: req.user.userId,
        status: "approved",
      });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers can view withdrawals",
        });
      }

      const withdrawals =
        await Withdrawal.find({
          seller: seller._id,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.json({
        success: true,
        withdrawals,
      });
    } catch (error) {
      console.error(
        "Seller withdrawal history error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load withdrawal history",
      });
    }
  }
);

/*
  SELLER WITHDRAWAL - REQUEST WITHDRAWAL

  POST /api/orders/seller-withdrawal/request
*/
router.post(
  "/seller-withdrawal/request",
  protect,
  async (req, res) => {
    const session =
      await mongoose.startSession();

    try {
      const seller = await Seller.findOne({
        user: req.user.userId,
        status: "approved",
      }).session(session);

      if (!seller) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers can request withdrawals",
        });
      }

      if (
        !seller.payout?.verified ||
        !seller.payout?.paystackRecipientCode
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please verify your payout bank account before requesting a withdrawal",
        });
      }

      const requestedAmount =
        req.body?.amount !== undefined
          ? Number(req.body.amount)
          : null;

      if (
        requestedAmount !== null &&
        (!Number.isFinite(
          requestedAmount
        ) ||
          requestedAmount <= 0)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Withdrawal amount must be greater than zero",
        });
      }

      let withdrawalResult = null;

      await session.withTransaction(
        async () => {
          const availableEarnings =
            await SellerEarning.find({
              seller: seller._id,
              status: "available",
            })
              .sort({
                createdAt: 1,
              })
              .session(session);

          if (!availableEarnings.length) {
            throw new Error(
              "NO_AVAILABLE_EARNINGS"
            );
          }

          const availableAmount =
            availableEarnings.reduce(
              (total, earning) =>
                total +
                Math.max(
                  0,
                  Number(
                    earning.netAmount || 0
                  ) -
                    Number(
                      earning.withdrawnAmount ||
                        0
                    ) -
                    Number(
                      earning.reservedAmount ||
                        0
                    )
                ),
              0
            );

          if (availableAmount <= 0) {
            throw new Error(
              "NO_AVAILABLE_EARNINGS"
            );
          }

          const existingWithdrawal =
            await Withdrawal.findOne({
              seller: seller._id,
              status: {
                $in: [
                  "pending",
                  "processing",
                ],
              },
            }).session(session);

          if (existingWithdrawal) {
            throw new Error(
              "WITHDRAWAL_ALREADY_PENDING"
            );
          }

          const withdrawalAmount =
            requestedAmount === null
              ? availableAmount
              : requestedAmount;

          if (
            withdrawalAmount >
            availableAmount
          ) {
            throw new Error(
              "INSUFFICIENT_AVAILABLE_BALANCE"
            );
          }

          const finalWithdrawalAmount =
            Math.round(
              withdrawalAmount * 100
            ) / 100;

          if (
            finalWithdrawalAmount <= 0
          ) {
            throw new Error(
              "NO_AVAILABLE_EARNINGS"
            );
          }

          const withdrawal =
            new Withdrawal({
              seller: seller._id,

              amount:
                finalWithdrawalAmount,

              currency: "NGN",

              status: "pending",

              recipientCode:
                seller.payout
                  .paystackRecipientCode,

              bankCode:
                seller.payout.bankCode,

              bankName:
                seller.payout.bankName,

              accountNumber:
                seller.payout.accountNumber,

              accountName:
                seller.payout.accountName,

              reason:
                "Seller earnings withdrawal",
            });

          await withdrawal.save({
            session,
          });

          let remainingAmount =
            finalWithdrawalAmount;

          for (
            const earning of availableEarnings
          ) {
            if (remainingAmount <= 0) {
              break;
            }

            const earningAvailable =
              Math.max(
                0,
                Number(
                  earning.netAmount || 0
                ) -
                  Number(
                    earning.withdrawnAmount ||
                      0
                  ) -
                  Number(
                    earning.reservedAmount ||
                      0
                  )
              );

            if (earningAvailable <= 0) {
              continue;
            }

            const amountToReserve =
              Math.min(
                earningAvailable,
                remainingAmount
              );

            earning.reservedAmount =
              Number(
                earning.reservedAmount || 0
              ) + amountToReserve;

            earning.status =
              "withdrawal_pending";

            earning.withdrawal =
              withdrawal._id;

            await earning.save({
              session,
            });

            remainingAmount =
              Math.round(
                (remainingAmount -
                  amountToReserve) *
                  100
              ) / 100;
          }

          if (remainingAmount > 0) {
            throw new Error(
              "WITHDRAWAL_RESERVATION_FAILED"
            );
          }

          withdrawalResult =
            withdrawal;
        }
      );

      return res.status(201).json({
        success: true,

        message:
          "Withdrawal request created successfully",

        withdrawal: {
          id:
            withdrawalResult._id,

          amount:
            withdrawalResult.amount,

          currency:
            withdrawalResult.currency,

          status:
            withdrawalResult.status,

          bankName:
            withdrawalResult.bankName,

          accountNumber:
            withdrawalResult.accountNumber,

          accountName:
            withdrawalResult.accountName,

          createdAt:
            withdrawalResult.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "Seller withdrawal request error:",
        error
      );

      if (
        error.message ===
        "NO_AVAILABLE_EARNINGS"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You do not have any available earnings to withdraw",
        });
      }

      if (
        error.message ===
        "WITHDRAWAL_ALREADY_PENDING"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You already have a withdrawal being processed",
        });
      }

      if (
        error.message ===
        "INSUFFICIENT_AVAILABLE_BALANCE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Withdrawal amount is greater than your available balance",
        });
      }

      if (
        error.message ===
        "WITHDRAWAL_RESERVATION_FAILED"
      ) {
        return res.status(500).json({
          success: false,
          message:
            "Unable to safely reserve the withdrawal amount",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to create withdrawal request",
      });
    } finally {
      await session.endSession();
    }
  }
);

/*
  SELLER WITHDRAWAL - CANCEL PENDING WITHDRAWAL

  POST /api/orders/seller-withdrawal/cancel
*/
router.post(
  "/seller-withdrawal/cancel",
  protect,
  async (req, res) => {
    const session =
      await mongoose.startSession();

    try {
      const seller = await Seller.findOne({
        user: req.user.userId,
        status: "approved",
      }).session(session);

      if (!seller) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers can cancel withdrawals",
        });
      }

      let cancelledWithdrawal = null;

      await session.withTransaction(
        async () => {
          const withdrawal =
            await Withdrawal.findOne({
              seller: seller._id,
              status: "pending",
            })
              .sort({
                createdAt: -1,
              })
              .session(session);

          if (!withdrawal) {
            throw new Error(
              "NO_PENDING_WITHDRAWAL"
            );
          }

          const earnings =
            await SellerEarning.find({
              seller: seller._id,
              withdrawal:
                withdrawal._id,
              status:
                "withdrawal_pending",
            }).session(session);

          for (const earning of earnings) {
            earning.reservedAmount = 0;

            earning.withdrawal = null;

            earning.status = "available";

            await earning.save({
              session,
            });
          }

          withdrawal.status =
            "cancelled";

          withdrawal.failureReason =
            withdrawal.failureReason ||
            "Withdrawal cancelled";

          withdrawal.failedAt =
            new Date();

          await withdrawal.save({
            session,
          });

          cancelledWithdrawal =
            withdrawal;
        }
      );

      return res.json({
        success: true,

        message:
          "Withdrawal cancelled successfully",

        withdrawal: {
          id:
            cancelledWithdrawal._id,

          amount:
            cancelledWithdrawal.amount,

          currency:
            cancelledWithdrawal.currency,

          status:
            cancelledWithdrawal.status,

          failureReason:
            cancelledWithdrawal.failureReason,

          failedAt:
            cancelledWithdrawal.failedAt,
        },
      });
    } catch (error) {
      console.error(
        "Cancel seller withdrawal error:",
        error
      );

      if (
        error.message ===
        "NO_PENDING_WITHDRAWAL"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No pending withdrawal found",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to cancel withdrawal",
      });
    } finally {
      await session.endSession();
    }
  }
);

/*
  SELLER WITHDRAWAL - PROCESS TEST/REAL TRANSFER

  POST /api/orders/seller-withdrawal/process

  IMPORTANT:
  Paystack webhook is the final authority for:
  - transfer.success
  - transfer.failed
  - transfer.reversed
*/
router.post(
  "/seller-withdrawal/process",
  protect,
  async (req, res) => {
    try {
      const seller = await Seller.findOne({
        user: req.user.userId,
        status: "approved",
      });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers can process withdrawals",
        });
      }

      const withdrawal =
        await Withdrawal.findOneAndUpdate(
          {
            seller: seller._id,
            status: "pending",
          },
          {
            $set: {
              status: "processing",
              processedAt: new Date(),
            },
          },
          {
            sort: {
              createdAt: 1,
            },
            new: true,
          }
        );

      if (!withdrawal) {
        return res.status(400).json({
          success: false,
          message:
            "No pending withdrawal found",
        });
      }

      const withdrawalEarnings =
        await SellerEarning.find({
          seller: seller._id,
          withdrawal: withdrawal._id,
          status: "withdrawal_pending",
        });

      if (!withdrawalEarnings.length) {
        withdrawal.status = "failed";

        withdrawal.failureReason =
          "No reserved earnings found for this withdrawal";

        withdrawal.failedAt = new Date();

        await withdrawal.save();

        return res.status(400).json({
          success: false,
          message:
            "No reserved earnings found for this withdrawal",
        });
      }

      const reservedAmount =
        withdrawalEarnings.reduce(
          (total, earning) =>
            total +
            Number(
              earning.reservedAmount || 0
            ),
          0
        );

      if (
        reservedAmount <= 0 ||
        Math.round(reservedAmount * 100) !==
          Math.round(
            Number(withdrawal.amount) * 100
          )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Withdrawal reservation does not match the withdrawal amount",
        });
      }

      if (!withdrawal.transferReference) {
        withdrawal.transferReference =
          `vendora-wd-${Date.now()}-${crypto
            .randomBytes(4)
            .toString("hex")}`;

        await withdrawal.save();
      }

      const transferReference =
        withdrawal.transferReference;

      let transferResult;

      try {
        transferResult =
          await createTransfer({
            amount:
              withdrawal.amount,

            recipientCode:
              withdrawal.recipientCode,

            reference:
              transferReference,

            reason:
              withdrawal.reason ||
              "Vendora seller withdrawal",
          });
      } catch (transferError) {
        console.error(
          "Paystack transfer request error:",
          transferError
        );

        withdrawal.status = "processing";

        withdrawal.failureReason =
          transferError.message ||
          "Transfer request could not be confirmed. Transfer remains under review.";

        await withdrawal.save();

        return res.status(202).json({
          success: false,

          message:
            "The transfer request could not be confirmed. The withdrawal remains processing to prevent a duplicate payout.",

          withdrawal: {
            id:
              withdrawal._id,

            amount:
              withdrawal.amount,

            currency:
              withdrawal.currency,

            status:
              withdrawal.status,

            transferReference:
              withdrawal.transferReference,

            failureReason:
              withdrawal.failureReason,

            processedAt:
              withdrawal.processedAt,
          },
        });
      }

      const transferData =
        transferResult?.data || {};

      withdrawal.transferCode =
        transferData.transfer_code ||
        withdrawal.transferCode ||
        "";

      withdrawal.transferReference =
        transferData.reference ||
        transferReference;

      withdrawal.paystackResponse =
        transferData;

      withdrawal.status = "processing";

      withdrawal.failureReason = "";

      await withdrawal.save();

      return res.status(200).json({
        success: true,

        message:
          "Withdrawal transfer submitted and is awaiting Paystack confirmation",

        withdrawal: {
          id:
            withdrawal._id,

          amount:
            withdrawal.amount,

          currency:
            withdrawal.currency,

          status:
            withdrawal.status,

          transferCode:
            withdrawal.transferCode,

          transferReference:
            withdrawal.transferReference,

          bankName:
            withdrawal.bankName,

          accountNumber:
            withdrawal.accountNumber,

          accountName:
            withdrawal.accountName,

          processedAt:
            withdrawal.processedAt,

          completedAt:
            withdrawal.completedAt || null,
        },
      });
    } catch (error) {
      console.error(
        "Process seller withdrawal error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to process withdrawal",
      });
    }
  }
);

const generateOrderNumber = () => {
  const timestamp =
    Date.now()
      .toString()
      .slice(-8);

  const random =
    crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase();

  return `VND-${timestamp}-${random}`;
};

/*
  CREATE ORDER FROM CART

  POST /api/orders
*/
router.post(
  "/",
  protect,
  async (req, res) => {
    const session = await mongoose.startSession();

    try {
      const {
        fullName,
        phone,
        address,
        city,
        state,
        couponCode,
      } = req.body;

      if (
        !fullName ||
        !phone ||
        !address ||
        !city ||
        !state
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Complete delivery information is required",
        });
      }

      /*
        Load the raw cart first.

        This allows us to detect products that were
        completely deleted from MongoDB after they
        were added to the buyer's cart.
      */
      const rawCart =
        await Cart.findOne({
          user: req.user.userId,
        });

      if (
        !rawCart ||
        !rawCart.items.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Your cart is empty",
        });
      }

      /*
        Remove cart items whose products no longer
        exist at all.
      */
      const staleProductIds = [];

      for (
        const cartItem of rawCart.items
      ) {
        if (!cartItem.product) {
          continue;
        }

        const productExists =
          await Product.exists({
            _id: cartItem.product,
          });

        if (!productExists) {
          staleProductIds.push(
            cartItem.product
          );
        }
      }

      if (
        staleProductIds.length > 0
      ) {
        await Cart.updateOne(
          {
            user:
              req.user.userId,
          },
          {
            $pull: {
              items: {
                product: {
                  $in:
                    staleProductIds,
                },
              },
            },
          }
        );
      }

      /*
        Reload the cart after stale products
        have been removed.
      */
      const cart =
        await Cart.findOne({
          user: req.user.userId,
        }).populate({
          path: "items.product",
          populate: {
            path: "seller",
            select:
              "storeName location rating status user",
            populate: {
              path: "user",
              select: "status",
            },
          },
        });

      if (
        !cart ||
        !cart.items.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All products in your cart are no longer available. Please return to your cart and add available products.",
        });
      }

      const orderItems = [];

      let subtotal = 0;

      for (
        const cartItem of cart.items
      ) {
        if (!cartItem.product) {
          continue;
        }

        const product =
          await Product.findOne({
            _id:
              cartItem.product._id,

            status: "active",
          }).populate({
            path: "seller",
            select:
              "storeName location rating status user",

            populate: {
              path: "user",
              select: "status",
            },
          });

        if (!product) {
          return res.status(400).json({
            success: false,
            message:
              "One or more products in your cart are no longer available. Please return to your cart.",
          });
        }

        if (!product.seller) {
          return res.status(400).json({
            success: false,
            message:
              "One of the products in your cart is no longer available.",
          });
        }

        if (
          product.seller.status !==
          "approved"
        ) {
          return res.status(400).json({
            success: false,
            message:
              `"${product.title}" is no longer available for purchase.`,
          });
        }

        if (
          !product.seller.user ||
          product.seller.user.status !==
            "active"
        ) {
          return res.status(400).json({
            success: false,
            message:
              `"${product.title}" is no longer available for purchase.`,
          });
        }

        const quantity =
          Number(
            cartItem.quantity
          );

        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Invalid quantity for "${product.title}".`,
          });
        }

        if (
          product.stock <
          quantity
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Only ${product.stock} item${
                product.stock === 1
                  ? ""
                  : "s"
              } of "${product.title}" are available`,
          });
        }

        const itemSubtotal =
          Number(product.price) *
          quantity;

        subtotal += itemSubtotal;

        orderItems.push({
          product:
            product._id,

          seller:
            product.seller._id,

          title:
            product.title,

          image:
            product.images?.[0] ||
            "",

          quantity,

          price:
            Number(product.price),

          subtotal:
            itemSubtotal,
        });
      }

      if (
        !orderItems.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All products in your cart are no longer available. Please return to your cart and add available products.",
        });
      }

      /*
        Round the server-calculated subtotal.
        Never trust a subtotal sent from the frontend.
      */
      subtotal =
        Math.round(
          subtotal * 100
        ) / 100;

      const deliveryFee = 0;

      /*
        ==========================================
        COUPON INFORMATION
        ==========================================

        Coupon validation is performed again here
        using the server-calculated subtotal.

        The frontend is NOT trusted for the discount.
      */
      let discount = 0;
      let appliedCouponCode = "";
      let couponId = null;

      if (
        couponCode &&
        String(couponCode).trim()
      ) {
        const normalizedCouponCode =
          String(couponCode)
            .trim()
            .toUpperCase();

        /*
          First validation before opening the
          transaction.
        */
        const coupon =
          await Coupon.findOne({
            code:
              normalizedCouponCode,
          });

        if (!coupon) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid coupon code",
          });
        }

        if (!coupon.isActive) {
          return res.status(400).json({
            success: false,
            message:
              "This coupon is no longer active",
          });
        }

        if (
          coupon.expiresAt &&
          new Date(
            coupon.expiresAt
          ) <= new Date()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "This coupon has expired",
          });
        }

        if (
          coupon.usageLimit !== null &&
          coupon.usedCount >=
            coupon.usageLimit
        ) {
          return res.status(400).json({
            success: false,
            message:
              "This coupon has reached its usage limit",
          });
        }

        const minimumOrderAmount =
          Number(
            coupon.minimumOrderAmount || 0
          );

        if (
          subtotal <
          minimumOrderAmount
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Minimum order amount for this coupon is ₦${minimumOrderAmount.toLocaleString()}`,
          });
        }

        /*
          Calculate discount on the server.
        */
        if (
          coupon.discountType ===
          "percentage"
        ) {
          discount =
            subtotal *
            (
              Number(
                coupon.discountValue
              ) / 100
            );

          if (
            coupon.maximumDiscountAmount !==
              null &&
            discount >
              Number(
                coupon.maximumDiscountAmount
              )
          ) {
            discount =
              Number(
                coupon.maximumDiscountAmount
              );
          }
        } else if (
          coupon.discountType ===
          "fixed"
        ) {
          discount =
            Number(
              coupon.discountValue
            );
        }

        /*
          A coupon can never discount more than
          the product subtotal.
        */
        discount =
          Math.min(
            discount,
            subtotal
          );

        discount =
          Math.max(
            discount,
            0
          );

        discount =
          Math.round(
            discount * 100
          ) / 100;

        appliedCouponCode =
          coupon.code;

        couponId =
          coupon._id;
      }

      /*
        Final order total.

        Coupon discount is platform-funded, so the
        seller's gross item amounts remain unchanged.
      */
      const total =
        Math.round(
          Math.max(
            subtotal +
              deliveryFee -
              discount,
            0
          ) * 100
        ) / 100;

      /*
        ==========================================
        CREATE ORDER + RESERVE COUPON ATOMICALLY
        ==========================================

        This prevents the following problem:

        1. Coupon usage is increased.
        2. Order creation fails.
        3. Coupon usage remains increased.

        Both operations now succeed or fail together.
      */
      let order;

      await session.withTransaction(
        async () => {
          /*
            If a coupon was supplied, re-check it
            inside the transaction immediately before
            creating the order.

            This protects against another buyer using
            the final available coupon at the same time.
          */
          if (couponId) {
            const couponFilter = {
              _id:
                couponId,

              code:
                appliedCouponCode,

              isActive:
                true,

              ...(couponCode
                ? {
                    $or: [
                      {
                        expiresAt:
                          null,
                      },
                      {
                        expiresAt: {
                          $gt:
                            new Date(),
                        },
                      },
                    ],
                  }
                : {}),
            };

            /*
              If the coupon has a usage limit,
              require usedCount to still be below
              that limit.
            */
            if (couponId) {
              const currentCoupon =
                await Coupon.findOne(
                  couponFilter
                ).session(
                  session
                );

              if (!currentCoupon) {
                throw new Error(
                  "COUPON_NO_LONGER_AVAILABLE"
                );
              }

              if (
                currentCoupon.usageLimit !==
                  null &&
                currentCoupon.usedCount >=
                  currentCoupon.usageLimit
              ) {
                throw new Error(
                  "COUPON_USAGE_LIMIT_REACHED"
                );
              }

              const currentMinimum =
                Number(
                  currentCoupon.minimumOrderAmount ||
                    0
                );

              if (
                subtotal <
                currentMinimum
              ) {
                throw new Error(
                  "COUPON_MINIMUM_ORDER_NOT_MET"
                );
              }

              /*
                Recalculate the discount from the
                current database coupon values.
              */
              let finalDiscount = 0;

              if (
                currentCoupon.discountType ===
                "percentage"
              ) {
                finalDiscount =
                  subtotal *
                  (
                    Number(
                      currentCoupon.discountValue
                    ) / 100
                  );

                if (
                  currentCoupon.maximumDiscountAmount !==
                    null &&
                  finalDiscount >
                    Number(
                      currentCoupon.maximumDiscountAmount
                    )
                ) {
                  finalDiscount =
                    Number(
                      currentCoupon.maximumDiscountAmount
                    );
                }
              } else if (
                currentCoupon.discountType ===
                "fixed"
              ) {
                finalDiscount =
                  Number(
                    currentCoupon.discountValue
                  );
              }

              finalDiscount =
                Math.min(
                  finalDiscount,
                  subtotal
                );

              finalDiscount =
                Math.max(
                  finalDiscount,
                  0
                );

              discount =
                Math.round(
                  finalDiscount * 100
                ) / 100;

              /*
                Atomically increase coupon usage.

                The usage limit is part of the filter,
                so two simultaneous orders cannot both
                consume the final coupon usage.
              */
              const couponUsageUpdate =
                await Coupon.findOneAndUpdate(
                  {
                    _id:
                      currentCoupon._id,

                    isActive:
                      true,

                    ...(currentCoupon.expiresAt
                      ? {
                          expiresAt: {
                            $gt:
                              new Date(),
                          },
                        }
                      : {}),

                    ...(currentCoupon.usageLimit !==
                    null
                      ? {
                          $expr: {
                            $lt: [
                              "$usedCount",
                              "$usageLimit",
                            ],
                          },
                        }
                      : {}),
                  },
                  {
                    $inc: {
                      usedCount: 1,
                    },
                  },
                  {
                    new: true,
                    session,
                  }
                );

              if (!couponUsageUpdate) {
                throw new Error(
                  "COUPON_NO_LONGER_AVAILABLE"
                );
              }

              appliedCouponCode =
                currentCoupon.code;
            }
          }

          /*
            Recalculate final total after the
            transaction-level coupon validation.
          */
          const finalTotal =
            Math.round(
              Math.max(
                subtotal +
                  deliveryFee -
                  discount,
                0
              ) * 100
            ) / 100;

          const createdOrders =
            await Order.create(
              [
                {
                  orderNumber:
                    generateOrderNumber(),

                  buyer:
                    req.user.userId,

                  items:
                    orderItems,

                  deliveryAddress: {
                    fullName:
                      String(
                        fullName
                      ).trim(),

                    phone:
                      String(
                        phone
                      ).trim(),

                    address:
                      String(
                        address
                      ).trim(),

                    city:
                      String(
                        city
                      ).trim(),

                    state:
                      String(
                        state
                      ).trim(),
                  },

                  subtotal,

                  couponCode:
                    appliedCouponCode,

                  discount,

                  deliveryFee,

                  total:
                    finalTotal,

                  paymentStatus:
                    "pending",

                  orderStatus:
                    "pending",
                },
              ],
              {
                session,
              }
            );

          order =
            createdOrders[0];
        }
      );

      /*
        Notification failure must never make
        an already-created order look like it failed.
      */
      try {
        await Notification.create({
          user:
            req.user.userId,

          type:
            "order_placed",

          title:
            "Order placed successfully",

          message:
            `Your order ${order.orderNumber} has been placed successfully.`,

          order:
            order._id,
        });
      } catch (notificationError) {
        console.error(
          "Order notification creation error:",
          notificationError
        );
      }

      return res.status(201).json({
        success: true,

        message:
          "Order created successfully",

        order,
      });
    } catch (error) {
      console.error(
        "Create order error:",
        error
      );

      /*
        Coupon-specific errors should return a
        normal client error instead of a 500.
      */
      if (
        error.message ===
        "COUPON_NO_LONGER_AVAILABLE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This coupon is no longer available. Please try another coupon.",
        });
      }

      if (
        error.message ===
        "COUPON_USAGE_LIMIT_REACHED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This coupon has reached its usage limit",
        });
      }

      if (
        error.message ===
        "COUPON_MINIMUM_ORDER_NOT_MET"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The minimum order amount for this coupon is no longer satisfied",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to create order",
      });
    } finally {
      await session.endSession();
    }
  }
);
/*
  SELLER DASHBOARD

  GET /api/orders/seller-dashboard

  IMPORTANT:
  This route is before /:orderId.
*/
router.get(
  "/seller-dashboard",
  protect,
  async (req, res) => {
    try {
      console.log(
        "Seller dashboard request from user:",
        req.user.userId
      );

      const seller =
        await Seller.findOne({
          user:
            req.user.userId,

          status:
            "approved",
        });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers can access the seller dashboard",
        });
      }

      console.log(
        "Seller found:",
        seller._id.toString()
      );

      const orders =
        await Order.find({
          "items.seller":
            seller._id,
        }).sort({
          createdAt: -1,
        });

      let totalSales = 0;

      const recentOrders =
        orders.map(
          (order) => {
            const sellerItems =
              order.items.filter(
                (item) =>
                  item.seller &&
                  item.seller.toString() ===
                    seller._id.toString()
              );

            const sellerOrderTotal =
              sellerItems.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.subtotal ||
                      0
                  ),
                0
              );

            if (
              order.paymentStatus ===
              "paid"
            ) {
              totalSales +=
                sellerOrderTotal;
            }

            return {
              id:
                order._id,

              orderNumber:
                order.orderNumber,

              buyer:
                order.buyer,

              total:
                sellerOrderTotal,

              paymentStatus:
                order.paymentStatus,

              orderStatus:
                order.orderStatus,

              createdAt:
                order.createdAt,

              items:
                sellerItems,
            };
          }
        );

      return res.json({
        success: true,

        stats: {
          orders:
            orders.length,

          sales:
            totalSales,

          rating:
            seller.rating || 0,
        },

        recentOrders:
          recentOrders.slice(
            0,
            5
          ),
      });
    } catch (error) {
      console.error(
        "Seller dashboard error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load seller dashboard",
      });
    }
  }
);

/*
  GET SELLER ORDERS

  GET /api/orders/seller-orders
*/
router.get(
  "/seller-orders",
  protect,
  async (req, res) => {
    try {
      const seller =
        await Seller.findOne({
          user:
            req.user.userId,

          status:
            "approved",
        });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers can access seller orders",
        });
      }

      const orders =
        await Order.find({
          "items.seller":
            seller._id,
        })
          .sort({
            createdAt: -1,
          })
          .populate(
            "buyer",
            "name email phone"
          );

      const sellerOrders =
        orders.map(
          (order) => {
            const sellerItems =
              order.items.filter(
                (item) =>
                  item.seller &&
                  item.seller.toString() ===
                    seller._id.toString()
              );

            const sellerTotal =
              sellerItems.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.subtotal ||
                      0
                  ),
                0
              );

            return {
              id:
                order._id,

              orderNumber:
                order.orderNumber,

              buyer:
                order.buyer,

              items:
                sellerItems,

              total:
                sellerTotal,

              paymentStatus:
                order.paymentStatus,

              orderStatus:
                order.orderStatus,

              deliveryAddress:
                order.deliveryAddress,

              createdAt:
                order.createdAt,
            };
          }
        );

      return res.json({
        success: true,

        count:
          sellerOrders.length,

        orders:
          sellerOrders,
      });
    } catch (error) {
      console.error(
        "Get seller orders error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load seller orders",
      });
    }
  }
);

/*
  UPDATE SELLER ORDER ITEM STATUS

  PATCH /api/orders/seller-orders/:orderId/items/:productId/status
*/
router.patch(
  "/seller-orders/:orderId/items/:productId/status",
  protect,
  async (req, res) => {
    try {
      const { status } =
        req.body;

      const allowedStatuses = [
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      if (
        !status ||
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order status",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.orderId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.productId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID",
        });
      }

      const seller =
        await Seller.findOne({
          user:
            req.user.userId,

          status:
            "approved",
        });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers can update order status",
        });
      }

      const order =
        await Order.findOne({
          _id:
            req.params.orderId,
        });

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      if (
        order.paymentStatus !==
        "paid"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Order must be paid before its status can be updated",
        });
      }

      const orderItem =
        order.items.find(
          (item) =>
            item.product &&
            item.product.toString() ===
              req.params.productId &&
            item.seller &&
            item.seller.toString() ===
              seller._id.toString()
        );

      if (!orderItem) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to update this product in the order",
        });
      }

      const currentStatus =
        orderItem.status ||
        "pending";

      const allowedTransitions =
        {
          pending: [
            "processing",
            "cancelled",
          ],

          processing: [
            "shipped",
            "cancelled",
          ],

          shipped: [
            "delivered",
          ],

          delivered: [],

          cancelled: [],
        };

      if (
        !allowedTransitions[
          currentStatus
        ]?.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Order item cannot move from ${currentStatus} to ${status}`,
        });
      }

      orderItem.status = status;

      /*
        =====================================================
        UPDATE OVERALL ORDER STATUS
        =====================================================
      */
      const itemStatuses = order.items.map(
        (item) => item.status || "pending"
      );

      if (
        itemStatuses.every(
          (itemStatus) =>
            itemStatus === "delivered"
        )
      ) {
        order.orderStatus =
          "delivered";
      } else if (
        itemStatuses.every(
          (itemStatus) =>
            itemStatus === "cancelled"
        )
      ) {
        order.orderStatus =
          "cancelled";
      } else if (
        itemStatuses.some(
          (itemStatus) =>
            itemStatus === "shipped"
        )
      ) {
        order.orderStatus =
          "shipped";
      } else if (
        itemStatuses.some(
          (itemStatus) =>
            itemStatus === "processing"
        )
      ) {
        order.orderStatus =
          "processing";
      } else {
        order.orderStatus =
          "pending";
      }

      /*
        Seller earnings become available
        only when the seller marks the
        purchased item as delivered.
      */
      if (status === "delivered") {
        await SellerEarning.updateMany(
          {
            seller: seller._id,
            order: order._id,
            product: orderItem.product,
            status: "pending",
          },
          {
            $set: {
              status: "available",
              availableAt: new Date(),
            },
          }
        );
      }

      await order.save();

      const notificationMessages =
        {
          processing: {
            title:
              "Order is being processed",

            message:
              `Your order ${order.orderNumber} is now being processed by the seller.`,

            type:
              "order_processing",
          },

          shipped: {
            title:
              "Order shipped",

            message:
              `Your order ${order.orderNumber} has been shipped by the seller.`,

            type:
              "order_shipped",
          },

          delivered: {
            title:
              "Order delivered",

            message:
              `Your order ${order.orderNumber} has been marked as delivered by the seller.`,

            type:
              "order_delivered",
          },

          cancelled: {
            title:
              "Order cancelled",

            message:
              `Your order ${order.orderNumber} has been cancelled by the seller.`,

            type:
              "order_cancelled",
          },
        };

      const notification =
        notificationMessages[
          status
        ];

      if (notification) {
        try {
          await Notification.create({
            user:
              order.buyer,

            type:
              notification.type,

            title:
              notification.title,

            message:
              notification.message,

            order:
              order._id,
          });
        } catch (
          notificationError
        ) {
          console.error(
            "Buyer notification creation error:",
            notificationError
          );
        }
      }

      return res.json({
        success: true,

        message:
          "Order item status updated successfully",

        order: {
          id:
            order._id,

          orderNumber:
            order.orderNumber,

          productId:
            orderItem.product,

          status:
            orderItem.status,
        },
      });
    } catch (error) {
      console.error(
        "Update seller order item status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update order item status",
      });
    }
  }
);

/*
  VALIDATE COUPON

  POST /api/orders/validate-coupon
*/
router.post(
  "/validate-coupon",
  protect,
  async (req, res) => {
    try {
      const {
        code,
        subtotal,
      } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          message:
            "Coupon code is required",
        });
      }

      const orderSubtotal =
        Number(subtotal);

      if (
        !Number.isFinite(
          orderSubtotal
        ) ||
        orderSubtotal < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order subtotal",
        });
      }

      const normalizedCode =
        String(code)
          .trim()
          .toUpperCase();

      const coupon =
        await Coupon.findOne({
          code: normalizedCode,
        });

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message:
            "Invalid coupon code",
        });
      }

      if (!coupon.isActive) {
        return res.status(400).json({
          success: false,
          message:
            "This coupon is no longer active",
        });
      }

      if (
        coupon.expiresAt &&
        new Date(coupon.expiresAt) <=
          new Date()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This coupon has expired",
        });
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usedCount >=
          coupon.usageLimit
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This coupon has reached its usage limit",
        });
      }

      if (
        orderSubtotal <
        Number(
          coupon.minimumOrderAmount ||
            0
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Minimum order amount for this coupon is ₦${Number(
              coupon.minimumOrderAmount ||
                0
            ).toLocaleString()}`,
        });
      }

      let discount = 0;

      if (
        coupon.discountType ===
        "percentage"
      ) {
        discount =
          orderSubtotal *
          (Number(
            coupon.discountValue
          ) / 100);

        if (
          coupon.maximumDiscountAmount !==
            null &&
          discount >
            Number(
              coupon.maximumDiscountAmount
            )
        ) {
          discount = Number(
            coupon.maximumDiscountAmount
          );
        }
      } else {
        discount = Number(
          coupon.discountValue
        );
      }

      discount = Math.min(
        discount,
        orderSubtotal
      );

      discount =
        Math.round(
          discount * 100
        ) / 100;

      const totalAfterDiscount =
        Math.round(
          (orderSubtotal -
            discount) *
            100
        ) / 100;

      return res.status(200).json({
        success: true,

        message:
          "Coupon applied successfully",

        coupon: {
          code:
            coupon.code,

          description:
            coupon.description,

          discountType:
            coupon.discountType,

          discountValue:
            coupon.discountValue,

          minimumOrderAmount:
            coupon.minimumOrderAmount,

          maximumDiscountAmount:
            coupon.maximumDiscountAmount,

          expiresAt:
            coupon.expiresAt,
        },

        discount,

        subtotal:
          orderSubtotal,

        total:
          totalAfterDiscount,
      });
    } catch (error) {
      console.error(
        "Validate coupon error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to validate coupon",
      });
    }
  }
);

/*
  INITIALIZE PAYSTACK PAYMENT

  POST /api/orders/:orderId/pay
*/
router.post(
  "/:orderId/pay",
  protect,
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.orderId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID",
        });
      }

      const order =
        await Order.findOne({
          _id:
            req.params.orderId,

          buyer:
            req.user.userId,
        });

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      if (
        order.paymentStatus ===
        "paid"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This order has already been paid for",
        });
      }

      for (
        const item of order.items
      ) {
        const product =
          await Product.findOne({
            _id:
              item.product,

            status:
              "active",
          }).populate({
            path:
              "seller",

            select:
              "status user",

            populate: {
              path:
                "user",

              select:
                "status",
            },
          });

        if (!product) {
          return res.status(400).json({
            success: false,
            message:
              `"${item.title}" is no longer available for payment.`,
          });
        }

        if (
          !product.seller ||
          product.seller.status !==
            "approved" ||
          !product.seller.user ||
          product.seller.user.status !==
            "active"
        ) {
          return res.status(400).json({
            success: false,
            message:
              `"${item.title}" is no longer available for payment.`,
          });
        }

        if (
          product.stock <
          item.quantity
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Insufficient stock for "${item.title}".`,
          });
        }
      }

      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found",
        });
      }

      if (!process.env.PAYSTACK_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message:
            "Paystack is not configured on the server",
        });
      }

      /*
        IMPORTANT:
        order.total already includes the coupon
        discount, so Paystack charges the
        discounted amount.
      */
      const amountInKobo =
        Math.round(
          Number(order.total) *
            100
        );

      const paystackResponse =
        await fetch(
          "https://api.paystack.co/transaction/initialize",
          {
            method: "POST",

            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email:
                user.email,

              amount:
                amountInKobo,

              currency:
                "NGN",

              metadata: {
                orderId:
                  order._id.toString(),

                orderNumber:
                  order.orderNumber,

                buyerId:
                  req.user.userId.toString(),

                couponCode:
                  order.couponCode ||
                  "",

                discount:
                  Number(
                    order.discount || 0
                  ),
              },

              callback_url:
                process.env
                  .PAYSTACK_CALLBACK_URL ||
                "http://localhost:5173/payment/callback",
            }),
          }
        );

      const paystackData =
        await paystackResponse.json();

      if (
        !paystackResponse.ok ||
        !paystackData.status
      ) {
        console.error(
          "Paystack initialization failed:",
          paystackData
        );

        return res.status(400).json({
          success: false,
          message:
            paystackData.message ||
            "Unable to initialize Paystack payment",
        });
      }

      const paymentReference =
        paystackData.data
          ?.reference;

      if (!paymentReference) {
        return res.status(400).json({
          success: false,
          message:
            "Paystack did not return a payment reference",
        });
      }

      await Payment.findOneAndUpdate(
        {
          order:
            order._id,
        },

        {
          $set: {
            buyer:
              req.user.userId,

            reference:
              paymentReference,

            amount:
              order.total,

            currency:
              "NGN",

            status:
              "pending",

            verificationProcessed:
              false,

            transactionId:
              "",

            channel:
              "",

            gatewayResponse:
              "",

            paidAt:
              null,

            refundedAmount:
              0,

            refundReference:
              "",

            refundedAt:
              null,

            verifiedAt:
              null,
          },
        },

        {
          upsert:
            true,

          new:
            true,

          setDefaultsOnInsert:
            true,
        }
      );

      order.paymentReference =
        paymentReference;

      await order.save();

      return res.json({
        success: true,

        message:
          "Payment initialized successfully",

        payment: {
          authorizationUrl:
            paystackData.data
              .authorization_url,

          accessCode:
            paystackData.data
              .access_code,

          reference:
            paymentReference,
        },

        order: {
          id:
            order._id,

          orderNumber:
            order.orderNumber,

          subtotal:
            order.subtotal,

          discount:
            order.discount || 0,

          couponCode:
            order.couponCode || "",

          total:
            order.total,
        },
      });
    } catch (error) {
      console.error(
        "Initialize Paystack payment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to initialize payment",
      });
    }
  }
);

/*
  VERIFY PAYSTACK PAYMENT

  POST /api/orders/:orderId/verify-payment
*/
router.post(
  "/:orderId/verify-payment",
  protect,
  async (req, res) => {
    const session =
      await mongoose.startSession();

    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.orderId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID",
        });
      }

      const { reference } =
        req.body;

      if (!reference) {
        return res.status(400).json({
          success: false,
          message:
            "Payment reference is required",
        });
      }

      const cleanReference =
        String(reference).trim();

      const order =
        await Order.findOne({
          _id:
            req.params.orderId,

          buyer:
            req.user.userId,
        });

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      if (
        order.paymentStatus ===
        "paid"
      ) {
        return res.json({
          success: true,
          message:
            "Order has already been paid for",
          order,
        });
      }

      if (
        !order.paymentReference
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This order does not have an active payment reference",
        });
      }

      if (
        order.paymentReference !==
        cleanReference
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment reference does not match this order",
        });
      }

      if (!process.env.PAYSTACK_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message:
            "Paystack is not configured on the server",
        });
      }

      const paystackResponse =
        await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(
            cleanReference
          )}`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );

      const paystackData =
        await paystackResponse.json();

      if (
        !paystackResponse.ok ||
        !paystackData.status
      ) {
        return res.status(400).json({
          success: false,
          message:
            paystackData.message ||
            "Unable to verify payment",
        });
      }

      const transaction =
        paystackData.data;

      if (
        transaction.status !==
        "success"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Payment has not been completed. Current status: ${transaction.status}`,
        });
      }

      if (
        transaction.reference !==
        order.paymentReference
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment reference does not match this order",
        });
      }

      const expectedAmount =
        Math.round(
          Number(order.total) *
            100
        );

      if (
        Number(transaction.amount) !==
        expectedAmount
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment amount does not match the order total",
        });
      }

      if (
        transaction.currency !==
        "NGN"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment currency",
        });
      }

      await session.withTransaction(
        async () => {
          const currentOrder =
            await Order.findOne({
              _id:
                order._id,

              buyer:
                req.user.userId,
            }).session(session);

          if (!currentOrder) {
            throw new Error(
              "Order not found during payment processing"
            );
          }

          if (
            currentOrder.paymentStatus ===
            "paid"
          ) {
            return;
          }

          /*
            Reduce stock only after Paystack
            confirms successful payment.
          */
          for (
            const item of currentOrder.items
          ) {
            const updatedProduct =
              await Product.findOneAndUpdate(
                {
                  _id:
                    item.product,

                  status:
                    "active",

                  stock: {
                    $gte:
                      item.quantity,
                  },
                },

                {
                  $inc: {
                    stock:
                      -item.quantity,
                  },
                },

                {
                  new:
                    true,

                  session,
                }
              );

            if (!updatedProduct) {
              throw new Error(
                `Insufficient stock for "${item.title}"`
              );
            }
          }

          currentOrder.paymentStatus =
            "paid";

          currentOrder.paymentReference =
            transaction.reference;

          currentOrder.orderStatus =
            "processing";

          await currentOrder.save({
            session,
          });

          const productSubtotal =
            Number(
              currentOrder.subtotal ||
                0
            );

          const commissionRate =
            Number(
              process.env
                .VENDORA_COMMISSION_RATE ||
                5
            );

          const sellerEarningData =
            currentOrder.items.map(
              (item) => {
                const grossAmount =
                  Number(
                    item.subtotal ||
                      0
                  );

                const commissionAmount =
                  Math.round(
                    grossAmount *
                      (commissionRate /
                        100) *
                      100
                  ) / 100;

                const netAmount =
                  Math.max(
                    grossAmount -
                      commissionAmount,
                    0
                  );

                const earningKey =
                  `${currentOrder._id.toString()}-${item.seller.toString()}-${item.product.toString()}`;

                return {
                  seller:
                    item.seller,

                  order:
                    currentOrder._id,

                  product:
                    item.product,

                  productTitle:
                    item.title,

                  quantity:
                    item.quantity,

                  grossAmount,

                  commissionAmount,

                  netAmount,

                  earningKey,
                };
              }
            );

          const totalCommissionAmount =
            sellerEarningData.reduce(
              (sum, earning) =>
                sum +
                Number(
                  earning.commissionAmount ||
                    0
                ),
              0
            );

          const roundedCommissionAmount =
            Math.round(
              totalCommissionAmount *
                100
            ) / 100;

          const sellerAmount =
            Math.max(
              productSubtotal -
                roundedCommissionAmount,
              0
            );

          const payment =
            await Payment.findOneAndUpdate(
              {
                order:
                  currentOrder._id,
              },

              {
                $set: {
                  buyer:
                    currentOrder.buyer,

                  reference:
                    transaction.reference,

                  transactionId:
                    transaction.id
                      ? String(
                          transaction.id
                        )
                      : "",

                  amount:
                    Number(
                      currentOrder.total ||
                        0
                    ),

                  currency:
                    transaction.currency ||
                    "NGN",

                  status:
                    "successful",

                  channel:
                    transaction.channel ||
                    "",

                  gatewayResponse:
                    transaction.gateway_response ||
                    "",

                  paidAt:
                    transaction.paid_at
                      ? new Date(
                          transaction.paid_at
                        )
                      : new Date(),

                  commissionAmount:
                    roundedCommissionAmount,

                  sellerAmount,

                  paystackData:
                    transaction,

                  verificationProcessed:
                    true,

                  verifiedAt:
                    new Date(),
                },
              },

              {
                upsert:
                  true,

                new:
                  true,

                setDefaultsOnInsert:
                  true,

                session,
              }
            );

          if (!payment) {
            throw new Error(
              "Unable to create payment record"
            );
          }

          /*
            Create seller earnings.

            The earningKey prevents duplicate
            earning records.
          */
          for (
            const earning of sellerEarningData
          ) {
            await SellerEarning.findOneAndUpdate(
              {
                earningKey:
                  earning.earningKey,
              },

              {
                $setOnInsert: {
                  seller:
                    earning.seller,

                  order:
                    earning.order,

                  payment:
                    payment._id,

                  product:
                    earning.product,

                  productTitle:
                    earning.productTitle,

                  quantity:
                    earning.quantity,

                  grossAmount:
                    earning.grossAmount,

                  commissionAmount:
                    earning.commissionAmount,

                  netAmount:
                    earning.netAmount,

                  status:
                    "pending",

                  availableAt:
                    null,

                  withdrawnAmount:
                    0,

                  refundedAmount:
                    0,

                  withdrawal:
                    null,

                  earningKey:
                    earning.earningKey,
                },
              },

              {
                upsert:
                  true,

                new:
                  true,

                setDefaultsOnInsert:
                  true,

                session,
              }
            );
          }

          const purchasedProductIds =
            currentOrder.items.map(
              (item) =>
                item.product.toString()
            );

          await Cart.updateOne(
            {
              user:
                req.user.userId,
            },

            {
              $pull: {
                items: {
                  product: {
                    $in:
                      purchasedProductIds,
                  },
                },
              },
            },

            {
              session,
            }
          );
        }
      );

      const finalOrder =
        await Order.findById(
          order._id
        ).populate(
          "items.seller",
          "storeName location rating"
        );

      return res.json({
        success: true,

        message:
          "Payment verified successfully",

        order:
          finalOrder,
      });
    } catch (error) {
      console.error(
        "Verify Paystack payment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to verify payment",
      });
    } finally {
      await session.endSession();
    }
  }
);

/*
  FIND ORDER BY PAYSTACK REFERENCE

  GET /api/orders/verify-reference/:reference
*/
router.get(
  "/verify-reference/:reference",
  protect,
  async (req, res) => {
    try {
      const reference =
        String(
          req.params.reference
        ).trim();

      if (!reference) {
        return res.status(400).json({
          success: false,
          message:
            "Payment reference is required",
        });
      }

      const order =
        await Order.findOne({
          paymentReference:
            reference,

          buyer:
            req.user.userId,
        });

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order for this payment was not found",
        });
      }

      return res.json({
        success: true,
        orderId:
          order._id,
      });
    } catch (error) {
      console.error(
        "Find payment order error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to find payment order",
      });
    }
  }
);

router.get(
  "/my-orders",
  protect,
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          buyer: req.user.userId,
        })
          .populate({
            path: "items.seller",
            select:
              "storeName logo",
          })
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error(
        "Get my orders error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load orders",
      });
    }
  }
);

router.get(
  "/test-paystack-refund-connection",
  protect,
  async (req, res) => {
    try {
      if (!process.env.PAYSTACK_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message:
            "PAYSTACK_SECRET_KEY is not configured",
        });
      }

      const response = await fetch(
        "https://api.paystack.co/bank",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const data =
        await response.json();

      return res.status(response.status).json({
        success:
          response.ok &&
          data?.status === true,

        message:
          data?.message ||
          "Paystack connection tested",
      });
    } catch (error) {
      console.error(
        "Paystack refund connection test error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to connect to Paystack",
      });
    }
  }
);

/*
  GET SINGLE ORDER

  IMPORTANT:
  This must remain the LAST GET route
  containing :orderId.

  GET /api/orders/:orderId
*/
router.get(
  "/:orderId",
  protect,
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.orderId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID",
        });
      }

      const order =
        await Order.findOne({
          _id:
            req.params.orderId,

          buyer:
            req.user.userId,
        }).populate(
          "items.seller",
          "storeName location rating"
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      return res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error(
        "Get order error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load order",
      });
    }
  }
);

module.exports = router;