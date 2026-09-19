const express = require("express");

const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// GET CURRENT USER PROFILE
// =====================================================
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "Get user profile error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to load profile",
    });
  }
});

// =====================================================
// UPDATE CURRENT USER PROFILE
// =====================================================
router.patch("/profile", protect, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      location,
      bio,
      profileImage,
    } = req.body;

    // -----------------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------------
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 100 characters",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // -----------------------------------------------
    // FIND USER
    // -----------------------------------------------
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -----------------------------------------------
    // CHECK EMAIL
    // -----------------------------------------------
    if (normalizedEmail !== user.email) {
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "That email address is already being used by another account",
        });
      }

      user.email = normalizedEmail;
    }

    // -----------------------------------------------
    // UPDATE PROFILE FIELDS
    // -----------------------------------------------
    user.name = name.trim();

    user.phone = phone
      ? phone.trim()
      : "";

    user.location = location
      ? location.trim()
      : "";

    user.bio = bio
      ? bio.trim()
      : "";

    user.profileImage = profileImage
      ? profileImage.trim()
      : "";

    await user.save();

    // -----------------------------------------------
    // RETURN SAFE USER DATA
    // -----------------------------------------------
    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      location: user.location,
      bio: user.bio,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "Update user profile error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
});

module.exports = router;