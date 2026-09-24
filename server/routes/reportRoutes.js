const express = require("express");
const mongoose = require("mongoose");

const Report = require("../models/Report");
const User = require("../models/User");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Order = require("../models/Order");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// CREATE REPORT
// POST /api/reports
// AUTHENTICATED USERS ONLY
// =====================================================
router.post(
  "/",
  protect,
  async (req, res) => {
    try {
      const {
        reportedUser,
        seller,
        product,
        order,
        category,
        subject,
        description,
        evidence,
      } = req.body;

      // -------------------------------------------------
      // REQUIRED FIELDS
      // -------------------------------------------------
      if (
        !category ||
        !subject ||
        !description
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Category, subject and description are required",
        });
      }

      // -------------------------------------------------
      // VALID CATEGORY
      // -------------------------------------------------
      const allowedCategories = [
        "fraud",
        "counterfeit",
        "prohibited-item",
        "misleading-listing",
        "scam",
        "harassment",
        "payment-issue",
        "other",
      ];

      if (
        !allowedCategories.includes(category)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid report category",
        });
      }

      // -------------------------------------------------
      // VALIDATE SUBJECT
      // -------------------------------------------------
      const trimmedSubject =
        String(subject).trim();

      if (!trimmedSubject) {
        return res.status(400).json({
          success: false,
          message:
            "Report subject cannot be empty",
        });
      }

      if (trimmedSubject.length > 200) {
        return res.status(400).json({
          success: false,
          message:
            "Report subject cannot exceed 200 characters",
        });
      }

      // -------------------------------------------------
      // VALIDATE DESCRIPTION
      // -------------------------------------------------
      const trimmedDescription =
        String(description).trim();

      if (!trimmedDescription) {
        return res.status(400).json({
          success: false,
          message:
            "Report description cannot be empty",
        });
      }

      if (trimmedDescription.length > 3000) {
        return res.status(400).json({
          success: false,
          message:
            "Report description cannot exceed 3000 characters",
        });
      }

      // -------------------------------------------------
      // VALIDATE OPTIONAL OBJECT IDS
      // -------------------------------------------------
      const idsToValidate = [
        {
          value: reportedUser,
          name: "reported user",
        },
        {
          value: seller,
          name: "seller",
        },
        {
          value: product,
          name: "product",
        },
        {
          value: order,
          name: "order",
        },
      ];

      for (const item of idsToValidate) {
        if (
          item.value &&
          !mongoose.Types.ObjectId.isValid(
            item.value
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Invalid ${item.name} ID`,
          });
        }
      }

      // -------------------------------------------------
      // MAKE SURE AT LEAST ONE TARGET EXISTS
      // -------------------------------------------------
      if (
        !reportedUser &&
        !seller &&
        !product &&
        !order
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A report must be associated with a user, seller, product or order",
        });
      }

      // -------------------------------------------------
      // VERIFY TARGETS EXIST
      // -------------------------------------------------
      if (reportedUser) {
        const user =
          await User.findById(
            reportedUser
          );

        if (!user) {
          return res.status(404).json({
            success: false,
            message:
              "Reported user not found",
          });
        }
      }

      if (seller) {
        const sellerRecord =
          await Seller.findById(seller);

        if (!sellerRecord) {
          return res.status(404).json({
            success: false,
            message:
              "Seller not found",
          });
        }
      }

      if (product) {
        const productRecord =
          await Product.findById(product);

        if (!productRecord) {
          return res.status(404).json({
            success: false,
            message:
              "Product not found",
          });
        }
      }

      if (order) {
        const orderRecord =
          await Order.findById(order);

        if (!orderRecord) {
          return res.status(404).json({
            success: false,
            message:
              "Order not found",
          });
        }
      }

      // -------------------------------------------------
      // PREVENT REPORTING YOURSELF
      // -------------------------------------------------
      if (
        reportedUser &&
        String(reportedUser) ===
          String(req.user.userId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot report yourself",
        });
      }

      // -------------------------------------------------
      // EVIDENCE
      // -------------------------------------------------
      let cleanedEvidence = [];

      if (Array.isArray(evidence)) {
        cleanedEvidence =
          evidence
            .filter(
              (item) =>
                typeof item === "string" &&
                item.trim()
            )
            .map((item) =>
              item.trim()
            )
            .slice(0, 10);
      }

      // -------------------------------------------------
      // CREATE REPORT
      // -------------------------------------------------
      const report =
        await Report.create({
          reporter:
            req.user.userId,

          reportedUser:
            reportedUser || null,

          seller:
            seller || null,

          product:
            product || null,

          order:
            order || null,

          category,

          subject:
            trimmedSubject,

          description:
            trimmedDescription,

          evidence:
            cleanedEvidence,
        });

      const populatedReport =
        await Report.findById(
          report._id
        )
          .populate(
            "reporter",
            "name email"
          )
          .populate(
            "reportedUser",
            "name email"
          )
          .populate(
            "seller",
            "storeName status"
          )
          .populate(
            "product",
            "title price status"
          );

      return res.status(201).json({
        success: true,
        message:
          "Report submitted successfully",
        report:
          populatedReport,
      });
    } catch (error) {
      console.error(
        "Create report error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to submit report",
      });
    }
  }
);

// =====================================================
// GET MY REPORTS
// GET /api/reports/my-reports
// AUTHENTICATED USERS ONLY
// =====================================================
router.get(
  "/my-reports",
  protect,
  async (req, res) => {
    try {
      const reports =
        await Report.find({
          reporter:
            req.user.userId,
        })
          .populate(
            "reportedUser",
            "name email"
          )
          .populate(
            "seller",
            "storeName status"
          )
          .populate(
            "product",
            "title price status"
          )
          .populate(
            "order",
            "orderNumber orderStatus paymentStatus"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        count: reports.length,
        reports,
      });
    } catch (error) {
      console.error(
        "Get my reports error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load your reports",
      });
    }
  }
);

// =====================================================
// GET ALL REPORTS
// GET /api/reports/admin
// ADMIN ONLY
// =====================================================
router.get(
  "/admin",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const {
        status,
        category,
      } = req.query;

      const filter = {};

      if (status) {
        const allowedStatuses = [
          "open",
          "under-review",
          "resolved",
          "dismissed",
        ];

        if (
          !allowedStatuses.includes(
            status
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid report status",
          });
        }

        filter.status = status;
      }

      if (category) {
        const allowedCategories = [
          "fraud",
          "counterfeit",
          "prohibited-item",
          "misleading-listing",
          "scam",
          "harassment",
          "payment-issue",
          "other",
        ];

        if (
          !allowedCategories.includes(
            category
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid report category",
          });
        }

        filter.category =
          category;
      }

      const reports =
        await Report.find(filter)
          .populate(
            "reporter",
            "name email"
          )
          .populate(
            "reportedUser",
            "name email role"
          )
          .populate(
            "seller",
            "storeName status"
          )
          .populate(
            "product",
            "title price status seller"
          )
          .populate(
            "order",
            "orderNumber orderStatus paymentStatus"
          )
          .populate(
            "resolvedBy",
            "name email"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        count: reports.length,
        reports,
      });
    } catch (error) {
      console.error(
        "Get admin reports error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load reports",
      });
    }
  }
);

// =====================================================
// GET SINGLE REPORT
// GET /api/reports/admin/:reportId
// ADMIN ONLY
// =====================================================
router.get(
  "/admin/:reportId",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const {
        reportId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          reportId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid report ID",
        });
      }

      const report =
        await Report.findById(
          reportId
        )
          .populate(
            "reporter",
            "name email role"
          )
          .populate(
            "reportedUser",
            "name email role"
          )
          .populate(
            "seller",
            "storeName status"
          )
          .populate(
            "product",
            "title price status seller"
          )
          .populate(
            "order"
          )
          .populate(
            "resolvedBy",
            "name email"
          );

      if (!report) {
        return res.status(404).json({
          success: false,
          message:
            "Report not found",
        });
      }

      return res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error(
        "Get single report error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load report",
      });
    }
  }
);

// =====================================================
// UPDATE REPORT
// PATCH /api/reports/admin/:reportId
// ADMIN ONLY
// =====================================================
router.patch(
  "/admin/:reportId",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const {
        reportId,
      } = req.params;

      const {
        status,
        adminNotes,
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          reportId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid report ID",
        });
      }

      const allowedStatuses = [
        "open",
        "under-review",
        "resolved",
        "dismissed",
      ];

      if (
        status !== undefined &&
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid report status",
        });
      }

      const report =
        await Report.findById(
          reportId
        );

      if (!report) {
        return res.status(404).json({
          success: false,
          message:
            "Report not found",
        });
      }

      if (status !== undefined) {
        report.status = status;

        if (
          status === "resolved" ||
          status === "dismissed"
        ) {
          report.resolvedBy =
            req.user.userId;

          report.resolvedAt =
            new Date();
        } else {
          report.resolvedBy = null;
          report.resolvedAt = null;
        }
      }

      if (
        adminNotes !== undefined
      ) {
        if (
          typeof adminNotes !==
          "string"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Admin notes must be text",
          });
        }

        const trimmedNotes =
          adminNotes.trim();

        if (
          trimmedNotes.length > 3000
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Admin notes cannot exceed 3000 characters",
          });
        }

        report.adminNotes =
          trimmedNotes;
      }

      await report.save();

      const updatedReport =
        await Report.findById(
          report._id
        )
          .populate(
            "reporter",
            "name email"
          )
          .populate(
            "reportedUser",
            "name email role"
          )
          .populate(
            "seller",
            "storeName status"
          )
          .populate(
            "product",
            "title price status seller"
          )
          .populate(
            "order",
            "orderNumber orderStatus paymentStatus"
          )
          .populate(
            "resolvedBy",
            "name email"
          );

      return res.json({
        success: true,
        message:
          "Report updated successfully",
        report:
          updatedReport,
      });
    } catch (error) {
      console.error(
        "Update report error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update report",
      });
    }
  }
);

module.exports = router;