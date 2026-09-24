const express = require("express");

const Coupon = require("../models/Coupon");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/*
  POST /api/coupons/validate

  Validate a coupon before checkout.
*/
router.post("/validate", protect, async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const orderSubtotal = Number(subtotal);

    if (
      !Number.isFinite(orderSubtotal) ||
      orderSubtotal < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order subtotal",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "This coupon is no longer active",
      });
    }

    if (
      coupon.expiresAt &&
      new Date(coupon.expiresAt) <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "This coupon has expired",
      });
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usageLimit !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "This coupon has reached its usage limit",
      });
    }

    if (
      orderSubtotal <
      Number(coupon.minimumOrderAmount || 0)
    ) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for this coupon is ₦${Number(
          coupon.minimumOrderAmount || 0
        ).toLocaleString()}`,
      });
    }

    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
      discountAmount =
        (orderSubtotal *
          Number(coupon.discountValue || 0)) /
        100;

      if (
        coupon.maximumDiscountAmount !== null &&
        coupon.maximumDiscountAmount !== undefined
      ) {
        discountAmount = Math.min(
          discountAmount,
          Number(coupon.maximumDiscountAmount)
        );
      }
    }

    if (coupon.discountType === "fixed") {
      discountAmount = Number(
        coupon.discountValue || 0
      );
    }

    /*
      Never allow a coupon to discount more
      than the order subtotal.
    */
    discountAmount = Math.min(
      Math.max(discountAmount, 0),
      orderSubtotal
    );

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumOrderAmount:
          coupon.minimumOrderAmount,
        maximumDiscountAmount:
          coupon.maximumDiscountAmount,
        discountAmount,
      },
    });
  } catch (error) {
    console.error(
      "Validate coupon error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to validate coupon",
    });
  }
});

module.exports = router;