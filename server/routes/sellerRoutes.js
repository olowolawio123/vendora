const express = require("express");

const Seller = require("../models/Seller");
const User = require("../models/User");
const Product = require("../models/Product");
const SellerEarning = require("../models/SellerEarning");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// BECOME A SELLER
// =====================================================
router.post("/become", protect, async (req, res) => {
  try {
    const {
      storeName,
      description,
      phone,
      location,
    } = req.body;

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
      message:
        "Seller application submitted successfully",
      seller,
    });
  } catch (error) {
    console.error(
      "Become seller error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to create seller profile",
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
    console.error(
      "Get seller profile error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to load seller profile",
    });
  }
});

// =====================================================
// UPDATE MY STORE SETTINGS
// SELLER ONLY
// =====================================================
router.patch("/me", protect, async (req, res) => {
  try {
    const {
      storeName,
      description,
      phone,
      location,
    } = req.body;

    const seller = await Seller.findOne({
      user: req.user.userId,
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    if (storeName !== undefined) {
      const trimmedStoreName =
        storeName.trim();

      if (!trimmedStoreName) {
        return res.status(400).json({
          success: false,
          message:
            "Store name cannot be empty",
        });
      }

      seller.storeName =
        trimmedStoreName;
    }

    if (description !== undefined) {
      seller.description =
        description.trim();
    }

    if (phone !== undefined) {
      seller.phone = phone.trim();
    }

    if (location !== undefined) {
      seller.location =
        location.trim();
    }

    await seller.save();

    const updatedSeller =
      await Seller.findById(
        seller._id
      ).populate(
        "user",
        "name email role"
      );

    res.json({
      success: true,
      message:
        "Store settings updated successfully",
      seller: updatedSeller,
    });
  } catch (error) {
    console.error(
      "Update seller store settings error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to update store settings",
    });
  }
});

// =====================================================
// GET MY SELLER EARNINGS
//
// GET /api/sellers/earnings
//
// Returns:
// - Total gross sales
// - Total Vendora commission
// - Total net earnings
// - Pending earnings
// - Available earnings
// - Withdrawn earnings
// - Earning records
// =====================================================
router.get(
  "/earnings",
  protect,
  async (req, res) => {
    try {
      const seller = await Seller.findOne({
        user: req.user.userId,
      });

      if (!seller) {
        return res.status(404).json({
          success: false,
          message:
            "Seller profile not found",
        });
      }

      const earnings =
        await SellerEarning.find({
          seller: seller._id,
        })
          .populate(
            "order",
            "orderNumber paymentStatus orderStatus createdAt"
          )
          .populate(
            "product",
            "title images price"
          )
          .sort({
            createdAt: -1,
          });

      /*
        Calculate financial totals from the
        individual seller earning records.
      */
      let totalGross = 0;
      let totalCommission = 0;
      let totalNet = 0;
      let pendingAmount = 0;
      let availableAmount = 0;
      let withdrawalPendingAmount = 0;
      let withdrawnAmount = 0;
      let cancelledAmount = 0;
      let refundedAmount = 0;

      for (const earning of earnings) {
        const gross =
          Number(
            earning.grossAmount || 0
          );

        const commission =
          Number(
            earning.commissionAmount || 0
          );

        const net =
          Number(
            earning.netAmount || 0
          );

        const withdrawn =
          Number(
            earning.withdrawnAmount || 0
          );

        const refunded =
          Number(
            earning.refundedAmount || 0
          );

        totalGross += gross;
        totalCommission += commission;
        totalNet += net;

        if (
          earning.status ===
          "pending"
        ) {
          pendingAmount += net;
        }

        if (
          earning.status ===
          "available"
        ) {
          availableAmount +=
            Math.max(
              net -
                withdrawn -
                refunded,
              0
            );
        }

        if (
          earning.status ===
          "withdrawal_pending"
        ) {
          withdrawalPendingAmount +=
            Math.max(
              net -
                withdrawn -
                refunded,
              0
            );
        }

        if (
          earning.status ===
          "withdrawn"
        ) {
          withdrawnAmount +=
            withdrawn > 0
              ? withdrawn
              : Math.max(
                  net - refunded,
                  0
                );
        }

        if (
          earning.status ===
          "cancelled"
        ) {
          cancelledAmount +=
            Math.max(
              net - refunded,
              0
            );
        }

        if (
          earning.status ===
            "refunded" ||
          earning.status ===
            "partially_refunded"
        ) {
          refundedAmount += refunded;
        }
      }

      /*
        Round financial values to two decimal
        places before returning them.
      */
      const roundMoney = (value) =>
        Math.round(
          Number(value || 0) * 100
        ) / 100;

      return res.json({
        success: true,

        seller: {
          id: seller._id,
          storeName: seller.storeName,
          status: seller.status,
        },

        summary: {
          totalGross:
            roundMoney(totalGross),

          totalCommission:
            roundMoney(
              totalCommission
            ),

          totalNet:
            roundMoney(totalNet),

          pendingAmount:
            roundMoney(
              pendingAmount
            ),

          availableAmount:
            roundMoney(
              availableAmount
            ),

          withdrawalPendingAmount:
            roundMoney(
              withdrawalPendingAmount
            ),

          withdrawnAmount:
            roundMoney(
              withdrawnAmount
            ),

          cancelledAmount:
            roundMoney(
              cancelledAmount
            ),

          refundedAmount:
            roundMoney(
              refundedAmount
            ),
        },

        count: earnings.length,

        earnings,
      });
    } catch (error) {
      console.error(
        "Get seller earnings error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load seller earnings",
      });
    }
  }
);

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
      const sellers = await Seller.find({
        status: "pending",
      })
        .populate(
          "user",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        count: sellers.length,
        sellers,
      });
    } catch (error) {
      console.error(
        "Get pending sellers error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load pending seller applications",
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
      const seller =
        await Seller.findById(
          req.params.sellerId
        );

      if (!seller) {
        return res.status(404).json({
          success: false,
          message:
            "Seller application not found",
        });
      }

      if (seller.status === "approved") {
        return res.status(400).json({
          success: false,
          message:
            "Seller is already approved",
        });
      }

      seller.status = "approved";

      await seller.save();

      await User.findByIdAndUpdate(
        seller.user,
        {
          role: "seller",
        }
      );

      res.json({
        success: true,
        message:
          "Seller approved successfully",
        seller,
      });
    } catch (error) {
      console.error(
        "Approve seller error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to approve seller",
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
      const seller =
        await Seller.findById(
          req.params.sellerId
        );

      if (!seller) {
        return res.status(404).json({
          success: false,
          message:
            "Seller application not found",
        });
      }

      seller.status = "suspended";

      await seller.save();

      await User.findByIdAndUpdate(
        seller.user,
        {
          role: "buyer",
        }
      );

      res.json({
        success: true,
        message:
          "Seller application rejected",
        seller,
      });
    } catch (error) {
      console.error(
        "Reject seller error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to reject seller",
      });
    }
  }
);

// =====================================================
// GET PUBLIC SELLER STORE
//
// IMPORTANT:
// Keep this route LAST because /:sellerId
// can otherwise catch routes such as /earnings.
// =====================================================
router.get(
  "/:sellerId",
  async (req, res) => {
    try {
      const { sellerId } =
        req.params;

      if (!sellerId) {
        return res.status(400).json({
          success: false,
          message:
            "Seller ID is required",
        });
      }

      const seller =
        await Seller.findOne({
          _id: sellerId,
          status: "approved",
        }).populate(
          "user",
          "name"
        );

      if (!seller) {
        return res.status(404).json({
          success: false,
          message:
            "Seller store not found",
        });
      }

      const products =
        await Product.find({
          seller: seller._id,
          status: "active",
        }).sort({
          createdAt: -1,
        });

      res.json({
        success: true,

        seller: {
          id: seller._id,
          storeName:
            seller.storeName,
          description:
            seller.description || "",
          location:
            seller.location || "",
          rating:
            seller.rating || 0,
          status:
            seller.status,
          ownerName:
            seller.user?.name || "",
          createdAt:
            seller.createdAt,
        },

        products,
      });
    } catch (error) {
      console.error(
        "Get public seller store error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load seller store",
      });
    }
  }
);

module.exports = router;