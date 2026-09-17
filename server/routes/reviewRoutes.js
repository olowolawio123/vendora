const express = require("express");

const Review = require("../models/Review");
const Order = require("../models/Order");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/*
  CREATE REVIEW

  POST /api/reviews
*/
router.post("/", protect, async (req, res) => {
  try {
    const {
      orderId,
      productId,
      rating,
      comment,
    } = req.body;

    if (!orderId || !productId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Order, product and rating are required",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rating must be a whole number between 1 and 5",
      });
    }

    /*
      Make sure the order belongs to this buyer
      and has actually been paid and delivered.
    */
    const order = await Order.findOne({
      _id: orderId,
      buyer: req.user.userId,
      paymentStatus: "paid",
      orderStatus: "delivered",
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message:
          "You can only review products from a paid and delivered order",
      });
    }

    /*
      Find the purchased product inside the order.
    */
    const orderItem = order.items.find(
      (item) =>
        item.product.toString() ===
        productId.toString()
    );

    if (!orderItem) {
      return res.status(403).json({
        success: false,
        message:
          "You did not purchase this product in the selected order",
      });
    }

    /*
      Get the product so we know its current seller.
    */
    const product = await Product.findById(
      productId
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /*
      Make sure the seller in the order matches
      the product's current seller.
    */
    if (
      product.seller.toString() !==
      orderItem.seller.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product seller information does not match the order",
      });
    }

    /*
      Prevent duplicate reviews for the same
      buyer + product + order.
    */
    const existingReview =
      await Review.findOne({
        buyer: req.user.userId,
        product: productId,
        order: orderId,
      });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message:
          "You have already reviewed this product",
      });
    }

    const review = await Review.create({
      buyer: req.user.userId,
      seller: orderItem.seller,
      product: productId,
      order: orderId,
      rating: numericRating,
      comment:
        typeof comment === "string"
          ? comment.trim()
          : "",
    });

    /*
      Recalculate the seller's average rating.
    */
    const ratingResult =
      await Review.aggregate([
        {
          $match: {
            seller: orderItem.seller,
          },
        },
        {
          $group: {
            _id: "$seller",
            averageRating: {
              $avg: "$rating",
            },
            reviewCount: {
              $sum: 1,
            },
          },
        },
      ]);

    const averageRating =
      ratingResult.length > 0
        ? Number(
            ratingResult[0].averageRating.toFixed(1)
          )
        : 0;

    await Seller.findByIdAndUpdate(
      orderItem.seller,
      {
        rating: averageRating,
      }
    );

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
      sellerRating: averageRating,
    });
  } catch (error) {
    console.error(
      "Create review error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to submit review",
    });
  }
});

/*
  GET PRODUCT REVIEWS

  GET /api/reviews/product/:productId
*/
router.get(
  "/product/:productId",
  async (req, res) => {
    try {
      const reviews = await Review.find({
        product: req.params.productId,
      })
        .populate("buyer", "name")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: reviews.length,
        reviews,
      });
    } catch (error) {
      console.error(
        "Get product reviews error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to load reviews",
      });
    }
  }
);

/*
  GET SELLER REVIEWS

  GET /api/reviews/seller/:sellerId
*/
router.get(
  "/seller/:sellerId",
  async (req, res) => {
    try {
      const reviews = await Review.find({
        seller: req.params.sellerId,
      })
        .populate("buyer", "name")
        .populate("product", "title")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: reviews.length,
        reviews,
      });
    } catch (error) {
      console.error(
        "Get seller reviews error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to load seller reviews",
      });
    }
  }
);

module.exports = router;