const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

/*
|--------------------------------------------------------------------------
| Helper: Normalize Nigerian phone number
|--------------------------------------------------------------------------
*/

const normalizeNigeriaPhone = (phone) => {
  if (!phone) {
    return "";
  }

  let value = String(phone)
    .trim()
    .replace(/[\s()-]/g, "");

  if (value.startsWith("0")) {
    value = `+234${value.substring(1)}`;
  } else if (value.startsWith("234")) {
    value = `+${value}`;
  }

  return value;
};

/*
|--------------------------------------------------------------------------
| Helper: Validate Nigerian phone number
|--------------------------------------------------------------------------
*/

const isValidNigeriaPhone = (phone) => {
  return /^\+234[789][01]\d{8}$/.test(phone);
};

/*
|--------------------------------------------------------------------------
| Helper: Validate strong password
|--------------------------------------------------------------------------
*/

const isStrongPassword = (password) => {
  if (!password || password.length < 8) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

  return (
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecialCharacter
  );
};

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone number and password are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = normalizeNigeriaPhone(phone);

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    const emailIsValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

    if (!emailIsValid) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address",
      });
    }

    if (!isValidNigeriaPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid Nigerian phone number",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number and special character",
      });
    }

    const existingEmail = await User.findOne({
      email: cleanEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    const existingPhone = await User.findOne({
      phone: cleanPhone,
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this phone number already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      phoneVerified: false,
      password: hashedPassword,
      role: "buyer",
    });

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully. Please verify your phone number.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error.message
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email or phone number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
});

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/
router.post("/login", async (req, res) => {
  try {
    const {
      identifier,
      password,
    } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email or phone number and password are required",
      });
    }

    const cleanIdentifier = identifier.trim();

    let user = null;

    if (cleanIdentifier.includes("@")) {
      user = await User.findOne({
        email: cleanIdentifier.toLowerCase(),
      });
    } else {
      const cleanPhone =
        normalizeNigeriaPhone(cleanIdentifier);

      user = await User.findOne({
        phone: cleanPhone,
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email/phone or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email/phone or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Keep the secure HttpOnly cookie authentication
    res.cookie("token", token, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge:
        7 * 24 * 60 * 60 * 1000,
    });

    // Also return the token so browsers that
    // don't send the cross-origin cookie can
    // use Authorization: Bearer <token>
    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
});

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
|
| Generates a secure one-time password reset token.
|
| DEVELOPMENT:
| The raw token is returned temporarily so the reset
| flow can be tested before an email provider is connected.
|
| IMPORTANT:
| Remove developmentToken before production.
|--------------------------------------------------------------------------
*/

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Email address is required",
      });
    }

    const cleanEmail = email
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: cleanEmail,
    });

    /*
    |--------------------------------------------------------------------------
    | Do not reveal whether account exists
    |--------------------------------------------------------------------------
    */

    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account exists with that email, password reset instructions have been prepared.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Generate secure random token
    |--------------------------------------------------------------------------
    */

    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    /*
    |--------------------------------------------------------------------------
    | Hash token before storing it
    |--------------------------------------------------------------------------
    */

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken, "utf8")
      .digest("hex");

    /*
    |--------------------------------------------------------------------------
    | Token expiration
    |--------------------------------------------------------------------------
    */

    const resetExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    /*
    |--------------------------------------------------------------------------
    | Save reset token directly to MongoDB
    |--------------------------------------------------------------------------
    */

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetToken: hashedResetToken,
          passwordResetExpires: resetExpires,
        },
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Development response
    |--------------------------------------------------------------------------
    |
    | This will later be replaced with an email reset link.
    |
    */

    return res.json({
      success: true,
      message:
        "If an account exists with that email, password reset instructions have been prepared.",

      // DEVELOPMENT ONLY
      // Remove this before production.
      developmentToken: resetToken,
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process password reset request",
    });
  }
});

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

router.post("/reset-password", async (req, res) => {
  try {
    const {
      token,
      password,
    } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token and new password are required",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number and special character",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Clean token
    |--------------------------------------------------------------------------
    */

    const cleanToken =
      String(token).trim();

    /*
    |--------------------------------------------------------------------------
    | Hash received token
    |--------------------------------------------------------------------------
    */

    const hashedToken = crypto
      .createHash("sha256")
      .update(cleanToken, "utf8")
      .digest("hex");

    /*
    |--------------------------------------------------------------------------
    | Find user by hashed token
    |--------------------------------------------------------------------------
    */

    const user = await User.findOne({
      passwordResetToken: hashedToken,
    });

    /*
    |--------------------------------------------------------------------------
    | Token not found
    |--------------------------------------------------------------------------
    */

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset link is invalid or has expired",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check token expiry
    |--------------------------------------------------------------------------
    */

    if (
      !user.passwordResetExpires ||
      user.passwordResetExpires.getTime() <=
        Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset link is invalid or has expired",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Hash new password
    |--------------------------------------------------------------------------
    */

    user.password =
      await bcrypt.hash(password, 12);

    /*
    |--------------------------------------------------------------------------
    | Clear reset token
    |--------------------------------------------------------------------------
    */

    user.passwordResetToken = "";
    user.passwordResetExpires = null;

    await user.save();

    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    return res.json({
      success: true,
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset password",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
*/

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(
      req.user.userId
    ).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to get current user",
    });
  }
});

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
  });

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
});

/*
|--------------------------------------------------------------------------
| GOOGLE LOGIN
|--------------------------------------------------------------------------
*/

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message:
          "Google credential is required",
      });
    }

    const ticket =
      await googleClient.verifyIdToken({
        idToken: credential,
        audience:
          process.env.GOOGLE_CLIENT_ID,
      });

    const payload =
      ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid Google account",
      });
    }

    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified,
    } = payload;

    if (
      !email ||
      !email_verified
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Google email could not be verified",
      });
    }

    const cleanEmail = email
      .trim()
      .toLowerCase();

    let user = await User.findOne({
      $or: [
        { googleId },
        { email: cleanEmail },
      ],
    });

    /*
    |--------------------------------------------------------------------------
    | Existing user
    |--------------------------------------------------------------------------
    */

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
      }

      if (
        !user.profileImage &&
        picture
      ) {
        user.profileImage = picture;
      }

      await user.save();
    } else {
      /*
      |--------------------------------------------------------------------------
      | New Google user
      |--------------------------------------------------------------------------
      */

      const randomPassword =
        `${googleId}-${Date.now()}-${Math.random()}`;

      const hashedPassword =
        await bcrypt.hash(
          randomPassword,
          12
        );

      user = await User.create({
        name:
          name || "Vendora User",

        email: cleanEmail,

        googleId,

        profileImage:
          picture || "",

        password:
          hashedPassword,

        role: "buyer",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create JWT
    |--------------------------------------------------------------------------
    */

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Set authentication cookie
    |--------------------------------------------------------------------------
    */

    res.cookie("token", token, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge:
        7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message:
        "Google login successful",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        phoneVerified:
          user.phoneVerified,
        profileImage:
          user.profileImage,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Google login error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Unable to authenticate with Google",
    });
  }
});

/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;