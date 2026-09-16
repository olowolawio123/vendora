const express = require("express");
const Product = require("../models/Product");
const Seller = require("../models/Seller");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const cloudinary = require("../config/cloudinary");
const router = express.Router();


// =====================================================
// GET ALL ACTIVE PRODUCTS
// PUBLIC
// =====================================================
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({
      status: "active",
    })
      .populate("seller", "storeName location rating")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get public products error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load products",
    });
  }
});


// =====================================================
// GET MY PRODUCTS
// APPROVED SELLERS ONLY
// =====================================================
router.get("/my-products", protect, async (req, res) => {
  try {
    const seller = await Seller.findOne({
      user: req.user.userId,
      status: "approved",
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Only approved sellers can access seller products",
      });
    }

    const products = await Product.find({
      seller: seller._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get seller products error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load products",
    });
  }
});


router.post(
  "/upload-image",
  protect,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select an image",
        });
      }

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "vendora/products",
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

        stream.end(req.file.buffer);
      });

      res.status(201).json({
        success: true,
        message: "Image uploaded successfully",
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to upload image",
      });
    }
  }
);

// =====================================================
// GET SINGLE ACTIVE PRODUCT
// PUBLIC
// =====================================================
router.get("/:productId", async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      status: "active",
    }).populate("seller", "storeName location rating");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product details error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load product",
    });
  }
});


// =====================================================
// CREATE PRODUCT
// APPROVED SELLERS ONLY
// =====================================================
router.post("/", protect, async (req, res) => {
  try {
    const seller = await Seller.findOne({
      user: req.user.userId,
      status: "approved",
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Only approved sellers can create products",
      });
    }

    const {
      title,
      description,
      price,
      category,
      images,
      stock,
      status,
    } = req.body;

    if (!title || !description || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title, description, category and price are required",
      });
    }

    const product = await Product.create({
      seller: seller._id,
      title,
      description,
      price,
      category,
      images: Array.isArray(images) ? images : [],
      stock: stock ?? 0,
      status: status || "draft",
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to create product",
    });
  }
});


// =====================================================
// UPDATE MY PRODUCT
// APPROVED SELLERS ONLY
// =====================================================
router.patch("/:productId", protect, async (req, res) => {
  try {
    const seller = await Seller.findOne({
      user: req.user.userId,
      status: "approved",
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Only approved sellers can update products",
      });
    }

    const product = await Product.findOne({
      _id: req.params.productId,
      seller: seller._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "price",
      "category",
      "images",
      "stock",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to update product",
    });
  }
});


// =====================================================
// DELETE MY PRODUCT
// APPROVED SELLERS ONLY
// =====================================================
router.delete("/:productId", protect, async (req, res) => {
  try {
    const seller = await Seller.findOne({
      user: req.user.userId,
      status: "approved",
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Only approved sellers can delete products",
      });
    }

    const product = await Product.findOne({
      _id: req.params.productId,
      seller: seller._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to delete product",
    });
  }
});


module.exports = router;