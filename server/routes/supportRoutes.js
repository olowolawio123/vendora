const express = require("express");
const mongoose = require("mongoose");
const SupportRequest = require("../models/SupportRequest");
const protect = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuthMiddleware");
const {
  sendSupportRequestEmail,
} = require("../services/emailService");

const router = express.Router();

// CREATE SUPPORT REQUEST
router.post(
  "/",
  optionalAuth,
  async (req, res) => {
    try {
      const {
        name,
        email,
        category,
        subject,
        message,
      } = req.body;

      if (
        !name ||
        !email ||
        !category ||
        !subject ||
        !message
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All support request fields are required",
        });
      }

      const supportRequest =
        await SupportRequest.create({
          user: req.user?.userId || null,
          name,
          email,
          category,
          subject,
          message,
        });

      try {
        await sendSupportRequestEmail(
          supportRequest
        );
      } catch (emailError) {
        console.error(
          "Support notification email failed:",
          emailError
        );
      }

      return res.status(201).json({
        success: true,
        message:
          "Support request submitted successfully",
        supportRequest: {
          id: supportRequest._id,
          name: supportRequest.name,
          email: supportRequest.email,
          category: supportRequest.category,
          subject: supportRequest.subject,
          message: supportRequest.message,
          status: supportRequest.status,
          createdAt: supportRequest.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "Create support request error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to submit support request",
      });
    }
  }
);

// GET CUSTOMER'S OWN SUPPORT REQUESTS
router.get(
  "/my-requests",
  protect,
  async (req, res) => {
    try {
      const supportRequests =
        await SupportRequest.find({
          user: req.user.userId,
        }).sort({
          createdAt: -1,
        });

      return res.json({
        success: true,
        supportRequests,
      });
    } catch (error) {
      console.error(
        "Get customer support requests error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load your support requests",
      });
    }
  }
);

// GET ALL SUPPORT REQUESTS
router.get(
  "/",
  protect,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const supportRequests =
        await SupportRequest.find()
          .populate("user", "name email")
          .sort({ createdAt: -1 });

      return res.json({
        success: true,
        supportRequests,
      });
    } catch (error) {
      console.error(
        "Get support requests error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load support requests",
      });
    }
  }
);

// UPDATE SUPPORT REQUEST STATUS
router.patch(
  "/:supportRequestId/status",
  protect,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const { supportRequestId } =
        req.params;

      const { status } = req.body;

      const allowedStatuses = [
        "open",
        "in-progress",
        "resolved",
        "closed",
      ];

      if (!status) {
        return res.status(400).json({
          success: false,
          message:
            "Support request status is required",
        });
      }

      if (
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid support request status",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          supportRequestId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid support request ID",
        });
      }

      const supportRequest =
        await SupportRequest.findByIdAndUpdate(
          supportRequestId,
          {
            status,
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(
          "user",
          "name email"
        );

      if (!supportRequest) {
        return res.status(404).json({
          success: false,
          message:
            "Support request not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Support request status updated successfully",
        supportRequest,
      });
    } catch (error) {
      console.error(
        "Update support request status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update support request status",
      });
    }
  }
);

module.exports = router;