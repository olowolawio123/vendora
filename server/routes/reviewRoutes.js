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

    /*
      Validate required fields
    */
    if (!orderId || !productId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Order, product and rating are required",
      });
    }

    /*
      Validate rating
    */
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
      Get the product.
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
      Make sure the product seller still matches
      the seller recorded in the order.
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

    /*
      Clean the comment.
    */
    const cleanComment =
      typeof comment === "string"
        ? comment.trim()
        : "";

    /*
      Create the review.
    */
    let review;

    try {
      review = await Review.create({
        buyer: req.user.userId,
        seller: orderItem.seller,
        product: productId,
        order: orderId,
        rating: numericRating,
        comment: cleanComment,
      });
    } catch (error) {
      /*
        The Review model has a unique compound index:

        buyer + product + order

        This protects against duplicate reviews even
        if two requests arrive at almost the same time.
      */
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "You have already reviewed this product",
        });
      }

      throw error;
    }

    /*
      =====================================================
      UPDATE PRODUCT RATING
      =====================================================

      Calculate the average rating and total number
      of reviews for this specific product.
    */
    const productRatingResult =
      await Review.aggregate([
        {
          $match: {
            product: product._id,
          },
        },
        {
          $group: {
            _id: "$product",
            averageRating: {
              $avg: "$rating",
            },
            reviewCount: {
              $sum: 1,
            },
          },
        },
      ]);

    const productAverageRating =
      productRatingResult.length > 0
        ? Number(
            productRatingResult[0].averageRating.toFixed(1)
          )
        : 0;

    const productReviewCount =
      productRatingResult.length > 0
        ? productRatingResult[0].reviewCount
        : 0;

    /*
      Save product rating and review count.
    */
    await Product.findByIdAndUpdate(
      product._id,
      {
        rating: productAverageRating,
        totalReviews: productReviewCount,
      }
    );

    /*
      =====================================================
      UPDATE SELLER RATING
      =====================================================

      Calculate the seller's average rating from
      all reviews belonging to this seller.
    */
    const sellerRatingResult =
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

    const sellerAverageRating =
      sellerRatingResult.length > 0
        ? Number(
            sellerRatingResult[0].averageRating.toFixed(1)
          )
        : 0;

    /*
      Save seller rating.
    */
    await Seller.findByIdAndUpdate(
      orderItem.seller,
      {
        rating: sellerAverageRating,
      }
    );

    /*
      Return the completed result.
    */
    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",

      review,

      productRating: productAverageRating,
      productTotalReviews: productReviewCount,

      sellerRating: sellerAverageRating,
    });
  } catch (error) {
    console.error(
      "Create review error:",
      error
    );

    return res.status(500).json({
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

      /*
        Calculate rating summary for the product.
      */
      const ratingResult =
        await Review.aggregate([
          {
            $match: {
              product: new (require("mongoose").Types.ObjectId)(
                req.params.productId
              ),
            },
          },
          {
            $group: {
              _id: "$product",
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

      const reviewCount =
        ratingResult.length > 0
          ? ratingResult[0].reviewCount
          : 0;

      return res.json({
        success: true,
        count: reviews.length,
        rating: averageRating,
        totalReviews: reviewCount,
        reviews,
      });
    } catch (error) {
      console.error(
        "Get product reviews error:",
        error.message
      );

      return res.status(500).json({
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

      /*
        Calculate seller rating summary.
      */
      const ratingResult =
        await Review.aggregate([
          {
            $match: {
              seller:
                new (require("mongoose").Types.ObjectId)(
                  req.params.sellerId
                ),
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

      const reviewCount =
        ratingResult.length > 0
          ? ratingResult[0].reviewCount
          : 0;

      return res.json({
        success: true,
        count: reviews.length,
        rating: averageRating,
        totalReviews: reviewCount,
        reviews,
      });
    } catch (error) {
      console.error(
        "Get seller reviews error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load seller reviews",
      });
    }
  }
);

module.exports = router;