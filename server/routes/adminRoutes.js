const express = require("express");

const User = require("../models/User");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Order = require("../models/Order");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// GET ADMIN DASHBOARD STATS
// ADMIN ONLY
// =====================================================
router.get(
  "/stats",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalSellers,
        totalProducts,
        totalOrders,
        pendingSellers,
      ] = await Promise.all([
        User.countDocuments({}),

        User.countDocuments({
          role: "seller",
        }),

        Product.countDocuments({}),

        Order.countDocuments({}),

        Seller.countDocuments({
          status: "pending",
        }),
      ]);

      res.json({
        success: true,
        stats: {
          totalUsers,
          totalSellers,
          totalProducts,
          totalOrders,
          pendingSellers,
        },
      });
    } catch (error) {
      console.error(
        "Get admin stats error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to load admin statistics",
      });
    }
  }
);

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

// =====================================================
// UPDATE USER ROLE
// ADMIN ONLY
// =====================================================
router.patch(
  "/users/:userId/role",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { role } = req.body;

      const allowedRoles = [
        "buyer",
        "seller",
        "admin",
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user role",
        });
      }

      if (
        req.user.userId.toString() ===
        req.params.userId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot change your own admin role",
        });
      }

      const user = await User.findById(
        req.params.userId
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.role = role;

      await user.save();

      res.json({
        success: true,
        message: "User role updated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error(
        "Update user role error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to update user role",
      });
    }
  }
);

// =====================================================
// UPDATE USER STATUS
// ADMIN ONLY
// =====================================================
router.patch(
  "/users/:userId/status",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "active",
        "suspended",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user status",
        });
      }

      if (
        req.user.userId.toString() ===
        req.params.userId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot suspend your own account",
        });
      }

      const user = await User.findById(
        req.params.userId
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // =================================================
      // SUSPEND / REACTIVATE SELLER
      // =================================================
      if (user.role === "seller") {
        const seller = await Seller.findOne({
          user: user._id,
        });

        if (seller) {
          // ---------------------------------------------
          // SUSPEND SELLER
          // ---------------------------------------------
          if (status === "suspended") {
            const productUpdateResult =
              await Product.updateMany(
                {
                  seller: seller._id,
                  sellerSuspended: false,
                },
                {
                  $set: {
                    sellerSuspended: true,
                  },
                }
              );

            console.log(
              `Hidden ${productUpdateResult.modifiedCount} products belonging to suspended seller ${seller._id}`
            );
          }

          // ---------------------------------------------
          // REACTIVATE SELLER
          // ---------------------------------------------
          if (status === "active") {
            const productUpdateResult =
              await Product.updateMany(
                {
                  seller: seller._id,
                  sellerSuspended: true,
                },
                {
                  $set: {
                    sellerSuspended: false,
                  },
                }
              );

            console.log(
              `Restored ${productUpdateResult.modifiedCount} products belonging to reactivated seller ${seller._id}`
            );
          }
        }
      }

      user.status = status;

      await user.save();

      res.json({
        success: true,
        message:
          status === "suspended"
            ? "User suspended successfully"
            : "User activated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error(
        "Update user status error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to update user status",
      });
    }
  }
);

// =====================================================
// DELETE USER
// ADMIN ONLY
// =====================================================
router.delete(
  "/users/:userId",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      if (
        req.user.userId.toString() ===
        req.params.userId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot delete your own admin account",
        });
      }

      const user = await User.findById(
        req.params.userId
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // =================================================
      // DELETE SELLER'S PRODUCTS AND SELLER PROFILE
      // =================================================
      if (user.role === "seller") {
        const seller = await Seller.findOne({
          user: user._id,
        });

        if (seller) {
          const productDeleteResult =
            await Product.deleteMany({
              seller: seller._id,
            });

          console.log(
            `Deleted ${productDeleteResult.deletedCount} products belonging to deleted seller ${seller._id}`
          );

          await Seller.findByIdAndDelete(
            seller._id
          );
        }
      }

      // =================================================
      // DELETE USER
      // =================================================
      await User.findByIdAndDelete(
        req.params.userId
      );

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete admin user error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Unable to delete user",
      });
    }
  }
);

module.exports = router;