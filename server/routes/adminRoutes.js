const express = require("express");

const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// GET ALL USERS
// ADMIN ONLY
// =====================================================
router.get(
  "/users",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const users = await User.find({})
        .select(
          "-password -passwordResetToken -passwordResetExpires"
        )
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      console.error(
        "Get admin users error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to load users",
      });
    }
  }
);

module.exports = router;