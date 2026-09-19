const express = require("express");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// --------------------------------------------------
// GET MY WISHLIST
// --------------------------------------------------

router.get("/", protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({
      user: req.user.userId,
    }).populate({
      path: "products",
      populate: {
        path: "seller",
        select: "storeName location rating",
      },
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.userId,
        products: [],
      });
    }

    res.json({
      success: true,
      wishlist: wishlist.products || [],
    });
  } catch (error) {
    console.error("Get wishlist error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load wishlist",
    });
  }
});

// --------------------------------------------------
// ADD PRODUCT TO WISHLIST
// --------------------------------------------------

router.post("/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let wishlist = await Wishlist.findOne({
      user: req.user.userId,
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.userId,
        products: [product._id],
      });

      return res.status(201).json({
        success: true,
        message: "Product added to wishlist",
        wishlist: wishlist.products,
      });
    }

    const alreadyExists = wishlist.products.some(
      (item) => item.toString() === product._id.toString()
    );

    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Product is already in your wishlist",
      });
    }

    wishlist.products.push(product._id);

    await wishlist.save();

    res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      wishlist: wishlist.products,
    });
  } catch (error) {
    console.error("Add wishlist error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to add product to wishlist",
    });
  }
});

// --------------------------------------------------
// REMOVE PRODUCT FROM WISHLIST
// --------------------------------------------------

router.delete("/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({
      user: req.user.userId,
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    const originalLength = wishlist.products.length;

    wishlist.products = wishlist.products.filter(
      (item) => item.toString() !== productId
    );

    if (wishlist.products.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: "Product is not in your wishlist",
      });
    }

    await wishlist.save();

    res.json({
      success: true,
      message: "Product removed from wishlist",
      wishlist: wishlist.products,
    });
  } catch (error) {
    console.error("Remove wishlist error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to remove product from wishlist",
    });
  }
});

// --------------------------------------------------
// CHECK IF PRODUCT IS IN WISHLIST
// --------------------------------------------------

router.get("/check/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({
      user: req.user.userId,
    });

    const isWishlisted =
      wishlist?.products?.some(
        (item) => item.toString() === productId
      ) || false;

    res.json({
      success: true,
      isWishlisted,
    });
  } catch (error) {
    console.error("Check wishlist error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to check wishlist",
    });
  }
});

module.exports = router;