const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();

  return `VND-${timestamp}-${random}`;
};

/*
  CREATE ORDER FROM CART
  POST /api/orders
*/
router.post("/", protect, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      address,
      city,
      state,
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
        message: "Complete delivery information is required",
      });
    }

    const cart = await Cart.findOne({
      user: req.user.userId,
    }).populate({
      path: "items.product",
      populate: {
        path: "seller",
        select: "storeName location rating",
      },
    });

    if (!cart || !cart.items.length) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const orderItems = [];
    let subtotal = 0;

    /*
      Check every product again from the database.

      We do not trust prices or stock coming from
      the frontend.
    */
    for (const cartItem of cart.items) {
      const product = await Product.findOne({
        _id: cartItem.product._id,
        status: "active",
      }).populate("seller", "storeName location rating");

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `The product "${cartItem.product.title}" is no longer available`,
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} item${
            product.stock === 1 ? "" : "s"
          } of "${product.title}" are available`,
        });
      }

      const itemSubtotal =
        product.price * cartItem.quantity;

      subtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        seller: product.seller._id,
        title: product.title,
        image: product.images?.[0] || "",
        quantity: cartItem.quantity,
        price: product.price,
        subtotal: itemSubtotal,
      });
    }

    /*
      Delivery is currently free.

      We can build a real delivery-fee system later.
    */
    const deliveryFee = 0;

    const total = subtotal + deliveryFee;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),

      buyer: req.user.userId,

      items: orderItems,

      deliveryAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
      },

      subtotal,
      deliveryFee,
      total,

      paymentStatus: "pending",
      orderStatus: "pending",
    });

    /*
      Important:
      Do not remove the cart until payment succeeds.
    */

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create order",
    });
  }
});

/*
  GET MY ORDERS
  GET /api/orders/my-orders
*/
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({
      buyer: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .populate(
        "items.seller",
        "storeName location rating"
      );

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load your orders",
    });
  }
});

/*
  INITIALIZE PAYSTACK PAYMENT

  POST /api/orders/:orderId/pay
*/
router.post("/:orderId/pay", protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      buyer: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid for",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Paystack is not configured on the server",
      });
    }

    /*
      Paystack expects the amount in kobo.

      Example:
      ₦5,000 = 500000 kobo
    */
    const amountInKobo = Math.round(order.total * 100);

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: amountInKobo,
          currency: "NGN",

          metadata: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            buyerId: req.user.userId.toString(),
          },

          callback_url:
            process.env.PAYSTACK_CALLBACK_URL ||
            "http://localhost:5173/payment/callback",
        }),
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
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
      paystackData.data.reference;

    order.paymentReference = paymentReference;

    await order.save();

    res.json({
      success: true,
      message: "Payment initialized successfully",

      payment: {
        authorizationUrl:
          paystackData.data.authorization_url,

        accessCode:
          paystackData.data.access_code,

        reference: paymentReference,
      },

      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
      },
    });
  } catch (error) {
    console.error(
      "Initialize Paystack payment error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to initialize payment",
    });
  }
});

/*
  VERIFY PAYSTACK PAYMENT

  POST /api/orders/:orderId/verify-payment
*/
router.post(
  "/:orderId/verify-payment",
  protect,
  async (req, res) => {
    const session = await mongoose.startSession();

    try {
      const { reference } = req.body;

      if (!reference) {
        return res.status(400).json({
          success: false,
          message: "Payment reference is required",
        });
      }

      const order = await Order.findOne({
        _id: req.params.orderId,
        buyer: req.user.userId,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      /*
        If this order has already been processed,
        do not reduce stock or touch the cart again.
      */
      if (order.paymentStatus === "paid") {
        return res.json({
          success: true,
          message: "Order has already been paid for",
          order,
        });
      }

      if (!process.env.PAYSTACK_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message: "Paystack is not configured on the server",
        });
      }

      /*
        Verify the transaction directly with Paystack.
      */
      const paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
          reference
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const paystackData = await paystackResponse.json();

      if (!paystackResponse.ok || !paystackData.status) {
        return res.status(400).json({
          success: false,
          message:
            paystackData.message ||
            "Unable to verify payment",
        });
      }

      const transaction = paystackData.data;

      /*
        transaction.status is the actual payment status.
      */
      if (transaction.status !== "success") {
        return res.status(400).json({
          success: false,
          message: `Payment has not been completed. Current status: ${transaction.status}`,
        });
      }

      /*
        Make sure the Paystack reference belongs
        to this order.
      */
      if (
        order.paymentReference &&
        order.paymentReference !== transaction.reference
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment reference does not match this order",
        });
      }

      /*
        Make sure the amount paid matches
        the order total.
      */
      const expectedAmount =
        Math.round(order.total * 100);

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

      /*
        Make sure the transaction currency is NGN.
      */
      if (transaction.currency !== "NGN") {
        return res.status(400).json({
          success: false,
          message: "Invalid payment currency",
        });
      }

      /*
        Payment is confirmed.

        Now we update the order, reduce stock,
        and remove the purchased products
        from the buyer's cart in one database
        transaction.
      */
      await session.withTransaction(async () => {
        /*
          Reload the order inside the transaction.
        */
        const currentOrder = await Order.findOne({
          _id: order._id,
          buyer: req.user.userId,
        }).session(session);

        if (!currentOrder) {
          throw new Error("Order not found during payment processing");
        }

        /*
          Prevent duplicate processing.
        */
        if (currentOrder.paymentStatus === "paid") {
          return;
        }

        /*
          Reduce stock for every purchased product.

          The stock condition prevents the database
          from reducing stock below zero.
        */
        for (const item of currentOrder.items) {
          const updatedProduct =
            await Product.findOneAndUpdate(
              {
                _id: item.product,
                status: "active",
                stock: { $gte: item.quantity },
              },
              {
                $inc: {
                  stock: -item.quantity,
                },
              },
              {
                new: true,
                session,
              }
            );

          if (!updatedProduct) {
            throw new Error(
              `Insufficient stock for "${item.title}"`
            );
          }
        }

        /*
          Mark the order as paid.
        */
        currentOrder.paymentStatus = "paid";
        currentOrder.paymentReference =
          transaction.reference;
        currentOrder.orderStatus = "processing";

        await currentOrder.save({
          session,
        });

        /*
          Remove only the products that were
          purchased in this order.

          We do not delete the entire cart blindly.
        */
        const purchasedProductIds =
          currentOrder.items.map((item) =>
            item.product.toString()
          );

        await Cart.updateOne(
          {
            user: req.user.userId,
          },
          {
            $pull: {
              items: {
                product: {
                  $in: purchasedProductIds,
                },
              },
            },
          },
          {
            session,
          }
        );
      });

      /*
        Load the final order after the transaction.
      */
      const finalOrder = await Order.findById(
        order._id
      ).populate(
        "items.seller",
        "storeName location rating"
      );

      res.json({
        success: true,
        message: "Payment verified successfully",
        order: finalOrder,
      });
    } catch (error) {
      console.error(
        "Verify Paystack payment error:",
        error
      );

      res.status(500).json({
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
      const order = await Order.findOne({
        paymentReference: req.params.reference,
        buyer: req.user.userId,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order for this payment was not found",
        });
      }

      res.json({
        success: true,
        orderId: order._id,
      });
    } catch (error) {
      console.error(
        "Find payment order error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to find payment order",
      });
    }
  }
);

/*
  GET SINGLE ORDER

  GET /api/orders/:orderId
*/
router.get(
  "/:orderId",
  protect,
  async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.orderId,
        buyer: req.user.userId,
      }).populate(
        "items.seller",
        "storeName location rating"
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error(
        "Get order error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to load order",
      });
    }
  }
);

module.exports = router;