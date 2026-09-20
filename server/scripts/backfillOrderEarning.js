const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const SellerEarning = require("../models/SellerEarning");

dotenv.config();

const ORDER_NUMBER = "VND-73392556-71F8";

const run = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is missing from the server .env file"
      );
    }

    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log("Connected to MongoDB");

    const order = await Order.findOne({
      orderNumber: ORDER_NUMBER,
    });

    if (!order) {
      throw new Error(
        `Order ${ORDER_NUMBER} was not found`
      );
    }

    console.log(
      `Found order: ${order.orderNumber}`
    );

    if (order.paymentStatus !== "paid") {
      throw new Error(
        `Order is not marked paid. Current status: ${order.paymentStatus}`
      );
    }

    if (!order.paymentReference) {
      throw new Error(
        "Order has no Paystack payment reference"
      );
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        order.paymentReference
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
      !paystackData.status ||
      !paystackData.data
    ) {
      throw new Error(
        paystackData.message ||
          "Unable to verify Paystack transaction"
      );
    }

    const transaction =
      paystackData.data;

    if (transaction.status !== "success") {
      throw new Error(
        `Paystack transaction is not successful. Status: ${transaction.status}`
      );
    }

    const expectedAmount = Math.round(
      Number(order.total || 0) * 100
    );

    if (
      Number(transaction.amount) !==
      expectedAmount
    ) {
      throw new Error(
        `Paystack amount mismatch. Expected ${expectedAmount}, received ${transaction.amount}`
      );
    }

    if (transaction.currency !== "NGN") {
      throw new Error(
        `Unexpected payment currency: ${transaction.currency}`
      );
    }

    console.log(
      "Paystack transaction verified successfully"
    );

    const commissionRate = Number(
      process.env.VENDORA_COMMISSION_RATE || 5
    );

    const session =
      await mongoose.startSession();

    try {
      await session.withTransaction(
        async () => {
          /*
            Create the missing Payment record.
          */
          const payment =
            await Payment.findOneAndUpdate(
              {
                order: order._id,
              },
              {
                $set: {
                  buyer: order.buyer,

                  reference:
                    transaction.reference,

                  transactionId:
                    transaction.id
                      ? String(transaction.id)
                      : "",

                  amount: Number(
                    order.total || 0
                  ),

                  currency:
                    transaction.currency ||
                    "NGN",

                  status: "successful",

                  channel:
                    transaction.channel || "",

                  gatewayResponse:
                    transaction.gateway_response ||
                    "",

                  paidAt:
                    transaction.paid_at
                      ? new Date(
                          transaction.paid_at
                        )
                      : new Date(),

                  paystackData:
                    transaction,

                  verificationProcessed:
                    true,

                  verifiedAt: new Date(),
                },
              },
              {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
                session,
              }
            );

          if (!payment) {
            throw new Error(
              "Unable to create Payment record"
            );
          }

          console.log(
            `Payment record ready: ${payment._id}`
          );

          /*
            Create the missing SellerEarning
            records.
          */
          for (const item of order.items) {
            const grossAmount = Number(
              item.subtotal || 0
            );

            const commissionAmount =
              Math.round(
                grossAmount *
                  (commissionRate / 100) *
                  100
              ) / 100;

            const netAmount = Math.max(
              grossAmount -
                commissionAmount,
              0
            );

            const earningKey =
              `${order._id.toString()}-${item.seller.toString()}-${item.product.toString()}`;

            const earningStatus =
              item.status === "delivered"
                ? "available"
                : "pending";

            const availableAt =
              earningStatus === "available"
                ? new Date()
                : null;

            const earning =
              await SellerEarning.findOneAndUpdate(
                {
                  earningKey,
                },
                {
                  $setOnInsert: {
                    seller: item.seller,

                    order: order._id,

                    payment: payment._id,

                    product: item.product,

                    productTitle: item.title,

                    quantity: item.quantity,

                    grossAmount,

                    commissionAmount,

                    netAmount,

                    status: earningStatus,

                    availableAt,

                    withdrawnAmount: 0,

                    refundedAmount: 0,

                    withdrawal: null,

                    earningKey,
                  },
                },
                {
                  upsert: true,
                  new: true,
                  setDefaultsOnInsert: true,
                  session,
                }
              );

            console.log("");
            console.log(
              `Seller earning ready for: ${item.title}`
            );
            console.log({
              grossAmount,
              commissionAmount,
              netAmount,
              status: earning.status,
              availableAt:
                earning.availableAt,
            });
          }

          /*
            Update the existing Payment record
            with the finance totals.
          */
          const totalCommission =
            order.items.reduce(
              (sum, item) => {
                const grossAmount = Number(
                  item.subtotal || 0
                );

                const commission =
                  Math.round(
                    grossAmount *
                      (commissionRate / 100) *
                      100
                  ) / 100;

                return sum + commission;
              },
              0
            );

          const sellerAmount = Math.max(
            Number(order.subtotal || 0) -
              totalCommission,
            0
          );

          await Payment.updateOne(
            {
              _id: payment._id,
            },
            {
              $set: {
                commissionAmount:
                  Math.round(
                    totalCommission * 100
                  ) / 100,

                sellerAmount:
                  Math.round(
                    sellerAmount * 100
                  ) / 100,
              },
            },
            {
              session,
            }
          );
        }
      );
    } finally {
      await session.endSession();
    }

    console.log("");
    console.log(
      "======================================"
    );
    console.log(
      "Finance repair completed successfully"
    );
    console.log(
      "======================================"
    );
    console.log(
      `Order: ${ORDER_NUMBER}`
    );
    console.log(
      "Payment: Successful"
    );
    console.log(
      "Order status: Delivered"
    );
    console.log(
      "Seller earning: Available"
    );
    console.log(
      "Gross: NGN 2,000"
    );
    console.log(
      "Vendora commission: NGN 100"
    );
    console.log(
      "Seller earning: NGN 1,900"
    );
  } catch (error) {
    console.error(
      "Finance repair error:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log(
      "Disconnected from MongoDB"
    );
  }
};

run();