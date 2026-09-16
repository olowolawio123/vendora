const express = require("express");
const Seller = require("../models/Seller");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// BECOME A SELLER
// =====================================================
router.post("/become", protect, async (req, res) => {
  try {
    const { storeName, description, phone, location } = req.body;

    if (!storeName) {
      return res.status(400).json({
        success: false,
        message: "Store name is required",
      });
    }

    const existingSeller = await Seller.findOne({
      user: req.user.userId,
    });

    if (existingSeller) {
      return res.status(409).json({
        success: false,
        message: "You already have a seller profile",
      });
    }

    const seller = await Seller.create({
      user: req.user.userId,
      storeName,
      description,
      phone,
      location,
    });

    res.status(201).json({
      success: true,
      message: "Seller application submitted successfully",
      seller,
    });
  } catch (error) {
    console.error("Become seller error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to create seller profile",
    });
  }
});


// =====================================================
// GET MY SELLER PROFILE
// =====================================================
router.get("/me", protect, async (req, res) => {
  try {
    const seller = await Seller.findOne({
      user: req.user.userId,
    }).populate("user", "name email role");

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    res.json({
      success: true,
      seller,
    });
  } catch (error) {
    console.error("Get seller profile error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load seller profile",
    });
  }
});

// =====================================================
// GET ALL PENDING SELLER APPLICATIONS
// ADMIN ONLY
// =====================================================
router.get(
  "/admin/pending",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const sellers = await Seller.find({ status: "pending" })
        .populate("user", "name email role")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: sellers.length,
        sellers,
      });
    } catch (error) {
      console.error("Get pending sellers error:", error.message);

      res.status(500).json({
        success: false,
        message: "Unable to load pending seller applications",
      });
    }
  }
);

// =====================================================
// APPROVE SELLER
// ADMIN ONLY
// =====================================================
router.patch(
  "/admin/:sellerId/approve",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const seller = await Seller.findById(req.params.sellerId);

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: "Seller application not found",
        });
      }

      if (seller.status === "approved") {
        return res.status(400).json({
          success: false,
          message: "Seller is already approved",
        });
      }

      seller.status = "approved";
      await seller.save();

      await User.findByIdAndUpdate(seller.user, {
        role: "seller",
      });

      res.json({
        success: true,
        message: "Seller approved successfully",
        seller,
      });
    } catch (error) {
      console.error("Approve seller error:", error.message);

      res.status(500).json({
        success: false,
        message: "Unable to approve seller",
      });
    }
  }
);

// =====================================================
// REJECT SELLER
// ADMIN ONLY
// =====================================================
router.patch(
  "/admin/:sellerId/reject",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const seller = await Seller.findById(req.params.sellerId);

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: "Seller application not found",
        });
      }

      seller.status = "suspended";
      await seller.save();

      await User.findByIdAndUpdate(seller.user, {
        role: "buyer",
      });

      res.json({
        success: true,
        message: "Seller application rejected",
        seller,
      });
    } catch (error) {
      console.error("Reject seller error:", error.message);

      res.status(500).json({
        success: false,
        message: "Unable to reject seller",
      });
    }
  }
);

module.exports = router;