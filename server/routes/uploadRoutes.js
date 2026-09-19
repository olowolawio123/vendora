const express = require("express");
const multer = require("multer");

const cloudinary = require("../config/cloudinary");
const protect = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

// =====================================================
// MULTER CONFIGURATION
// =====================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only JPG, PNG, and WEBP images are allowed"
        )
      );
    }

    cb(null, true);
  },
});

// =====================================================
// UPLOAD PROFILE IMAGE
// POST /api/uploads/profile-image
// =====================================================

router.post(
  "/profile-image",
  protect,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      // Check if an image was selected
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select an image",
        });
      }

      // Find logged-in user
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Upload image to Cloudinary
      const uploadImage = () => {
        return new Promise((resolve, reject) => {
          const uploadStream =
            cloudinary.uploader.upload_stream(
              {
                folder: "vendora/profile-images",

                // One profile image per user
                public_id: `user-${user._id}`,

                overwrite: true,

                resource_type: "image",
              },

              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );

          uploadStream.end(req.file.buffer);
        });
      };

      const result = await uploadImage();

      // Save Cloudinary URL to user's profile
      user.profileImage = result.secure_url;

      await user.save();

      return res.json({
        success: true,
        message: "Profile image uploaded successfully",
        profileImage: user.profileImage,
      });
    } catch (error) {
      console.error(
        "Profile image upload error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to upload profile image",
      });
    }
  }
);

module.exports = router;