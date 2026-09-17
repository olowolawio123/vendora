const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const Seller = require("../models/Seller");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const generateOrderNumber = () => {
  const timestamp = Date.now()
    .toString()
    .slice(-8);

  const random = crypto
    .randomBytes(2)
    .toString("hex")
    .toUpperCase();

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
        message:
          "Complete delivery information is required",
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

    for (const cartItem of cart.items) {
      const product = await Product.findOne({
        _id: cartItem.product._id,
        status: "active",
      }).populate(
        "seller",
        "storeName location rating"
      );

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

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

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
router.get(
  "/my-orders",
  protect,
  async (req, res) => {
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
      console.error(
        "Get my orders error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to load your orders",
      });
    }
  }
);

/*
  SELLER DASHBOARD

  IMPORTANT:
  This route is deliberately placed BEFORE
  every /:orderId route.

  GET /api/orders/seller-dashboard
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

      const seller = await Seller.findOne({
        user: req.user.userId,
        status: "approved",
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

      const orders = await Order.find({
        "items.seller": seller._id,
      }).sort({
        createdAt: -1,
      });

      let totalSales = 0;

      const recentOrders = orders.map(
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
                Number(item.subtotal || 0),
              0
            );

          if (
            order.paymentStatus === "paid"
          ) {
            totalSales +=
              sellerOrderTotal;
          }

          return {
            id: order._id,
            orderNumber:
              order.orderNumber,
            buyer: order.buyer,
            total: sellerOrderTotal,
            paymentStatus:
              order.paymentStatus,
            orderStatus:
              order.orderStatus,
            createdAt:
              order.createdAt,
            items: sellerItems,
          };
        }
      );

      return res.json({
  success: true,

  stats: {
    orders: orders.length,
    sales: totalSales,
    rating: seller.rating || 0,
  },

  recentOrders:
    recentOrders.slice(0, 5),
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
      const seller = await Seller.findOne({
        user: req.user.userId,
        status: "approved",
      });

      if (!seller) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved sellers can access seller orders",
        });
      }

      const orders = await Order.find({
        "items.seller": seller._id,
      })
        .sort({ createdAt: -1 })
        .populate("buyer", "name email phone");

      const sellerOrders = orders.map((order) => {
        const sellerItems = order.items.filter(
          (item) =>
            item.seller &&
            item.seller.toString() ===
              seller._id.toString()
        );

        const sellerTotal = sellerItems.reduce(
          (sum, item) =>
            sum + Number(item.subtotal || 0),
          0
        );

        return {
          id: order._id,
          orderNumber: order.orderNumber,
          buyer: order.buyer,
          items: sellerItems,
          total: sellerTotal,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          deliveryAddress: order.deliveryAddress,
          createdAt: order.createdAt,
        };
      });

      return res.json({
        success: true,
        count: sellerOrders.length,
        orders: sellerOrders,
      });
    } catch (error) {
      console.error(
        "Get seller orders error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load seller orders",
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
          message:
            "This order has already been paid for",
        });
      }

      const user = await User.findById(
        req.user.userId
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found",
        });
      }

      if (!process.env.PAYSTACK_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message:
            "Paystack is not configured on the server",
        });
      }

      const amountInKobo = Math.round(
        order.total * 100
      );

      const paystackResponse = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: user.email,
            amount: amountInKobo,
            currency: "NGN",

            metadata: {
              orderId:
                order._id.toString(),
              orderNumber:
                order.orderNumber,
              buyerId:
                req.user.userId.toString(),
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
        paystackData.data.reference;

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
            paystackData.data.access_code,

          reference:
            paymentReference,
        },

        order: {
          id: order._id,
          orderNumber:
            order.orderNumber,
          total: order.total,
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
      const { reference } = req.body;

      if (!reference) {
        return res.status(400).json({
          success: false,
          message:
            "Payment reference is required",
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

      if (order.paymentStatus === "paid") {
        return res.json({
          success: true,
          message:
            "Order has already been paid for",
          order,
        });
      }

      if (!process.env.PAYSTACK_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message:
            "Paystack is not configured on the server",
        });
      }

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
        transaction.status !== "success"
      ) {
        return res.status(400).json({
          success: false,
          message: `Payment has not been completed. Current status: ${transaction.status}`,
        });
      }

      if (
        order.paymentReference &&
        order.paymentReference !==
          transaction.reference
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment reference does not match this order",
        });
      }

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

      if (
        transaction.currency !== "NGN"
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
              _id: order._id,
              buyer: req.user.userId,
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

          for (
            const item of currentOrder.items
          ) {
            const updatedProduct =
              await Product.findOneAndUpdate(
                {
                  _id: item.product,
                  status: "active",
                  stock: {
                    $gte: item.quantity,
                  },
                },

                {
                  $inc: {
                    stock:
                      -item.quantity,
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

          currentOrder.paymentStatus =
            "paid";

          currentOrder.paymentReference =
            transaction.reference;

          currentOrder.orderStatus =
            "processing";

          await currentOrder.save({
            session,
          });

          const purchasedProductIds =
            currentOrder.items.map(
              (item) =>
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
        order: finalOrder,
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
      const order = await Order.findOne({
        paymentReference:
          req.params.reference,

        buyer: req.user.userId,
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
        orderId: order._id,
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

/*
  GET SINGLE ORDER

  IMPORTANT:
  This is the LAST GET route with :orderId.

  GET /api/orders/:orderId
*/
router.get(
  "/:orderId",
  protect,
  async (req, res) => {
    try {
      /*
        Make sure the ID is actually a MongoDB
        ObjectId before querying MongoDB.

        This prevents errors such as:

        Cast to ObjectId failed for value
        "seller-dashboard"
      */
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

      const order =
        await Order.findOne({
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
        message: "Unable to load order",
      });
    }
  }
);

module.exports = router;