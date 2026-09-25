const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const {
  sendVerificationCodeEmail,
  sendPasswordResetCodeEmail,
  sendLoginVerificationCodeEmail,
} = require("../services/emailService");

const router = express.Router();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// =====================================================
// SECURITY SETTINGS
// =====================================================

const LOGIN_CODE_EXPIRY_MS =
  10 * 60 * 1000;

const TRUSTED_DEVICE_EXPIRY_MS =
  60 * 60 * 1000;

const LOGIN_CODE_RESEND_COOLDOWN_MS =
  60 * 1000;

const MAX_LOGIN_VERIFICATION_ATTEMPTS = 5;

const AUTH_COOKIE_MAX_AGE =
  7 * 24 * 60 * 60 * 1000;

const TRUSTED_DEVICE_COOKIE =
  "vendora_device";

// =====================================================
// HELPERS
// =====================================================

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

const isValidNigeriaPhone = (phone) => {
  return /^\+234[789][01]\d{8}$/.test(phone);
};

const isStrongPassword = (password) => {
  if (!password || password.length < 8) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialCharacter =
    /[^A-Za-z0-9]/.test(password);

  return (
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecialCharacter
  );
};

const generateSixDigitCode = () => {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
};

const hashCode = (code) => {
  return crypto
    .createHash("sha256")
    .update(String(code), "utf8")
    .digest("hex");
};

const generateTrustedDeviceToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const hashTrustedDeviceToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(String(token), "utf8")
    .digest("hex");
};

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
};

const setTrustedDeviceCookie = (
  res,
  deviceToken
) => {
  res.cookie(
    TRUSTED_DEVICE_COOKIE,
    deviceToken,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge:
        TRUSTED_DEVICE_EXPIRY_MS,
    }
  );
};

const clearTrustedDeviceCookie = (res) => {
  res.clearCookie(
    TRUSTED_DEVICE_COOKIE,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
    }
  );
};

const createAuthToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const getSafeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    profileImage: user.profileImage,
    role: user.role,
  };
};

const getMaskedEmail = (email) => {
  if (!email || !email.includes("@")) {
    return "";
  }

  const [name, domain] =
    email.split("@");

  if (name.length <= 2) {
    return `${name.charAt(0)}***@${domain}`;
  }

  return `${name.charAt(0)}${"*".repeat(
    Math.min(name.length - 1, 5)
  )}@${domain}`;
};

const cleanExpiredTrustedDevices = (
  user
) => {
  const now = Date.now();

  user.trustedDevices =
    (user.trustedDevices || []).filter(
      (device) =>
        device.expiresAt &&
        new Date(
          device.expiresAt
        ).getTime() > now
    );
};

const isTrustedDevice = (user, token) => {
  if (!token) {
    return false;
  }

  const tokenHash =
    hashTrustedDeviceToken(token);

  const now = Date.now();

  return (user.trustedDevices || []).some(
    (device) => {
      if (!device.expiresAt) {
        return false;
      }

      const expiresAt =
        new Date(
          device.expiresAt
        ).getTime();

      return (
        device.tokenHash === tokenHash &&
        expiresAt > now
      );
    }
  );
};

const issueSuccessfulLogin = (
  res,
  user
) => {
  const token = createAuthToken(user);

  setAuthCookie(res, token);

  return {
    success: true,
    message: "Login successful",
    token,
    user: getSafeUser(user),
  };
};

const issueGoogleSuccessfulLogin = (
  res,
  user
) => {
  const token = createAuthToken(user);

  setAuthCookie(res, token);

  return {
    success: true,
    message: "Google login successful",
    user: getSafeUser(user),
  };
};

const sendLoginVerificationCode = async (
  user
) => {
  const verificationCode =
    generateSixDigitCode();

  const hashedVerificationCode =
    hashCode(verificationCode);

  user.loginVerificationCode =
    hashedVerificationCode;

  user.loginVerificationCodeExpires =
    new Date(
      Date.now() +
        LOGIN_CODE_EXPIRY_MS
    );

  user.loginVerificationAttempts = 0;

  user.loginVerificationLastSentAt =
    new Date();

  await user.save();

  try {
    await sendLoginVerificationCodeEmail(
      user.email,
      verificationCode
    );
  } catch (error) {
    user.loginVerificationCode = "";
    user.loginVerificationCodeExpires =
      null;
    user.loginVerificationAttempts = 0;
    user.loginVerificationLastSentAt =
      null;

    await user.save();

    throw error;
  }
};

// =====================================================
// REGISTER
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone number and password are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail =
      email.trim().toLowerCase();
    const cleanPhone =
      normalizeNigeriaPhone(phone);

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must be at least 2 characters",
      });
    }

    const emailIsValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      );

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

    const existingEmail =
      await User.findOne({
        email: cleanEmail,
      });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    const existingPhone =
      await User.findOne({
        phone: cleanPhone,
      });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this phone number already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const verificationCode =
      generateSixDigitCode();

    const hashedVerificationCode =
      hashCode(verificationCode);

    const verificationExpires =
      new Date(
        Date.now() + 10 * 60 * 1000
      );

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,

      emailVerified: false,

      emailVerificationCode:
        hashedVerificationCode,

      emailVerificationCodeExpires:
        verificationExpires,

      phoneVerified: false,

      password: hashedPassword,

      role: "buyer",
    });

    try {
      await sendVerificationCodeEmail(
        cleanEmail,
        verificationCode
      );
    } catch (emailError) {
      await User.deleteOne({
        _id: user._id,
      });

      console.error(
        "Registration verification email failed:",
        emailError.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send verification email. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully. A 6-digit verification code has been sent to your email.",
      requiresEmailVerification: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        emailVerified:
          user.emailVerified,
        phoneVerified:
          user.phoneVerified,
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

// =====================================================
// VERIFY EMAIL
// =====================================================

router.post(
  "/verify-email",
  async (req, res) => {
    try {
      const {
        email,
        code,
      } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message:
            "Email address and verification code are required",
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const cleanCode =
        String(code).trim();

      if (!/^\d{6}$/.test(cleanCode)) {
        return res.status(400).json({
          success: false,
          message:
            "Verification code must be 6 digits",
        });
      }

      const user =
        await User.findOne({
          email: cleanEmail,
        });

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification code or email address",
        });
      }

      if (user.emailVerified) {
        return res.json({
          success: true,
          message:
            "Email address is already verified",
        });
      }

      if (
        !user.emailVerificationCode ||
        !user.emailVerificationCodeExpires
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No active verification code was found. Please request a new code.",
        });
      }

      if (
        user.emailVerificationCodeExpires.getTime() <=
        Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This verification code has expired. Please request a new code.",
        });
      }

      const hashedCode =
        hashCode(cleanCode);

      if (
        hashedCode !==
        user.emailVerificationCode
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification code",
        });
      }

      user.emailVerified = true;
      user.emailVerificationCode = "";
      user.emailVerificationCodeExpires =
        null;

      await user.save();

      return res.json({
        success: true,
        message:
          "Email verified successfully. You can now login.",
        emailVerified: true,
      });
    } catch (error) {
      console.error(
        "Email verification error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify email address",
      });
    }
  }
);

// =====================================================
// RESEND EMAIL VERIFICATION CODE
// =====================================================

router.post(
  "/resend-verification-code",
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "Email address is required",
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const user =
        await User.findOne({
          email: cleanEmail,
        });

      if (!user) {
        return res.json({
          success: true,
          message:
            "If an account exists with that email, a new verification code has been sent.",
        });
      }

      if (user.emailVerified) {
        return res.json({
          success: true,
          message:
            "This email address is already verified.",
        });
      }

      const verificationCode =
        generateSixDigitCode();

      const hashedVerificationCode =
        hashCode(verificationCode);

      const verificationExpires =
        new Date(
          Date.now() + 10 * 60 * 1000
        );

      user.emailVerificationCode =
        hashedVerificationCode;

      user.emailVerificationCodeExpires =
        verificationExpires;

      await user.save();

      try {
        await sendVerificationCodeEmail(
          cleanEmail,
          verificationCode
        );
      } catch (emailError) {
        console.error(
          "Resend verification email failed:",
          emailError.message
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to send verification email. Please try again.",
        });
      }

      return res.json({
        success: true,
        message:
          "A new verification code has been sent to your email.",
      });
    } catch (error) {
      console.error(
        "Resend verification code error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to resend verification code",
      });
    }
  }
);

// =====================================================
// LOGIN
// =====================================================

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

    const cleanIdentifier =
      identifier.trim();

    let user = null;

    if (cleanIdentifier.includes("@")) {
      user = await User.findOne({
        email:
          cleanIdentifier.toLowerCase(),
      });
    } else {
      const cleanPhone =
        normalizeNigeriaPhone(
          cleanIdentifier
        );

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

    const passwordMatch =
      await bcrypt.compare(
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

    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been suspended. Please contact Vendora support.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email address before logging in.",
        requiresEmailVerification: true,
        email: user.email,
      });
    }

    /*
     * Check whether this browser/device has
     * already been verified within the last hour.
     */

    const deviceToken =
      req.cookies[TRUSTED_DEVICE_COOKIE];

    cleanExpiredTrustedDevices(user);

    const trusted =
      isTrustedDevice(
        user,
        deviceToken
      );

    if (trusted) {
      const deviceTokenHash =
        hashTrustedDeviceToken(
          deviceToken
        );

      const trustedDevice =
        user.trustedDevices.find(
          (device) =>
            device.tokenHash ===
            deviceTokenHash
        );

      if (trustedDevice) {
        trustedDevice.lastUsedAt =
          new Date();

        await user.save();
      }

      const response =
        issueSuccessfulLogin(
          res,
          user
        );

      return res.json(response);
    }

    /*
     * This device is new or its one-hour
     * verification period has expired.
     */

    const now = Date.now();

    if (
      user.loginVerificationLastSentAt &&
      now -
        new Date(
          user.loginVerificationLastSentAt
        ).getTime() <
        LOGIN_CODE_RESEND_COOLDOWN_MS &&
      user.loginVerificationCode &&
      user.loginVerificationCodeExpires &&
      new Date(
        user.loginVerificationCodeExpires
      ).getTime() > now
    ) {
      const remainingSeconds =
        Math.ceil(
          (
            LOGIN_CODE_RESEND_COOLDOWN_MS -
            (
              now -
              new Date(
                user.loginVerificationLastSentAt
              ).getTime()
            )
          ) / 1000
        );

      return res.status(200).json({
        success: true,
        requiresLoginVerification: true,
        message:
          "A login verification code has already been sent to your email.",
        email: getMaskedEmail(
          user.email
        ),
        verificationEmail: user.email,
        resendAvailableIn:
          Math.max(
            remainingSeconds,
            1
          ),
      });
    }

    try {
      await sendLoginVerificationCode(
        user
      );
    } catch (emailError) {
      console.error(
        "Login verification email failed:",
        emailError.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send login verification code. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      requiresLoginVerification: true,
      message:
        "A 6-digit login verification code has been sent to your email.",
      email: getMaskedEmail(
        user.email
      ),
      verificationEmail: user.email,
      expiresIn: 600,
      resendAvailableIn: 60,
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

// =====================================================
// VERIFY LOGIN CODE
// =====================================================

router.post(
  "/verify-login",
  async (req, res) => {
    try {
      const {
        email,
        code,
      } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message:
            "Email address and login verification code are required",
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const cleanCode =
        String(code).trim();

      if (!/^\d{6}$/.test(cleanCode)) {
        return res.status(400).json({
          success: false,
          message:
            "Login verification code must be 6 digits",
        });
      }

      const user =
        await User.findOne({
          email: cleanEmail,
        });

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or expired login verification code",
        });
      }

      if (user.status === "suspended") {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been suspended. Please contact Vendora support.",
        });
      }

      if (
        !user.loginVerificationCode ||
        !user.loginVerificationCodeExpires
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No active login verification code was found. Please request a new code.",
        });
      }

      if (
        new Date(
          user.loginVerificationCodeExpires
        ).getTime() <= Date.now()
      ) {
        user.loginVerificationCode = "";
        user.loginVerificationCodeExpires =
          null;
        user.loginVerificationAttempts = 0;
        user.loginVerificationLastSentAt =
          null;

        await user.save();

        return res.status(400).json({
          success: false,
          message:
            "Login verification code has expired. Please request a new code.",
        });
      }

      if (
        user.loginVerificationAttempts >=
        MAX_LOGIN_VERIFICATION_ATTEMPTS
      ) {
        user.loginVerificationCode = "";
        user.loginVerificationCodeExpires =
          null;
        user.loginVerificationAttempts = 0;
        user.loginVerificationLastSentAt =
          null;

        await user.save();

        return res.status(429).json({
          success: false,
          message:
            "Too many incorrect attempts. Please request a new login verification code.",
        });
      }

      const hashedCode =
        hashCode(cleanCode);

      if (
        hashedCode !==
        user.loginVerificationCode
      ) {
        user.loginVerificationAttempts +=
          1;

        const attemptsLeft =
          Math.max(
            MAX_LOGIN_VERIFICATION_ATTEMPTS -
              user.loginVerificationAttempts,
            0
          );

        if (
          user.loginVerificationAttempts >=
          MAX_LOGIN_VERIFICATION_ATTEMPTS
        ) {
          user.loginVerificationCode =
            "";
          user.loginVerificationCodeExpires =
            null;
          user.loginVerificationAttempts = 0;
          user.loginVerificationLastSentAt =
            null;

          await user.save();

          return res.status(429).json({
            success: false,
            message:
              "Too many incorrect attempts. Please request a new login verification code.",
          });
        }

        await user.save();

        return res.status(400).json({
          success: false,
          message:
            `Invalid login verification code. ${attemptsLeft} attempt${
              attemptsLeft === 1
                ? ""
                : "s"
            } remaining.`,
        });
      }

      /*
       * Code is correct.
       *
       * Invalidate it immediately so it can never
       * be reused.
       */

      user.loginVerificationCode = "";
      user.loginVerificationCodeExpires =
        null;
      user.loginVerificationAttempts = 0;
      user.loginVerificationLastSentAt =
        null;

      /*
       * Create a fresh trusted-device token.
       *
       * Only the hash is stored in MongoDB.
       */

      const deviceToken =
        generateTrustedDeviceToken();

      const deviceTokenHash =
        hashTrustedDeviceToken(
          deviceToken
        );

      const deviceExpiresAt =
        new Date(
          Date.now() +
            TRUSTED_DEVICE_EXPIRY_MS
        );

      cleanExpiredTrustedDevices(user);

      user.trustedDevices.push({
        tokenHash:
          deviceTokenHash,
        createdAt: new Date(),
        expiresAt:
          deviceExpiresAt,
        lastUsedAt:
          new Date(),
      });

      /*
       * Keep the device list bounded.
       * The newest 10 trusted devices are kept.
       */

      if (
        user.trustedDevices.length >
        10
      ) {
        user.trustedDevices =
          user.trustedDevices
            .sort(
              (a, b) =>
                new Date(
                  b.createdAt
                ).getTime() -
                new Date(
                  a.createdAt
                ).getTime()
            )
            .slice(0, 10);
      }

      await user.save();

      setTrustedDeviceCookie(
        res,
        deviceToken
      );

      const response =
        issueSuccessfulLogin(
          res,
          user
        );

      return res.json({
        ...response,
        message:
          "Login verified successfully",
      });
    } catch (error) {
      console.error(
        "Login verification error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify login",
      });
    }
  }
);

// =====================================================
// RESEND LOGIN VERIFICATION CODE
// =====================================================

router.post(
  "/resend-login-code",
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "Email address is required",
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const user =
        await User.findOne({
          email: cleanEmail,
        });

      /*
       * Do not reveal whether an account exists.
       */

      if (!user) {
        return res.json({
          success: true,
          message:
            "If an account exists with that email, a new login verification code has been sent.",
        });
      }

      if (user.status === "suspended") {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been suspended. Please contact Vendora support.",
        });
      }

      const now = Date.now();

      if (
        user.loginVerificationLastSentAt &&
        now -
          new Date(
            user.loginVerificationLastSentAt
          ).getTime() <
          LOGIN_CODE_RESEND_COOLDOWN_MS
      ) {
        const remainingSeconds =
          Math.ceil(
            (
              LOGIN_CODE_RESEND_COOLDOWN_MS -
              (
                now -
                new Date(
                  user.loginVerificationLastSentAt
                ).getTime()
              )
            ) / 1000
          );

        return res.status(429).json({
          success: false,
          message:
            `Please wait ${Math.max(
              remainingSeconds,
              1
            )} seconds before requesting another code.`,
          resendAvailableIn:
            Math.max(
              remainingSeconds,
              1
            ),
        });
      }

      try {
        await sendLoginVerificationCode(
          user
        );
      } catch (emailError) {
        console.error(
          "Resend login verification email failed:",
          emailError.message
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to send login verification code. Please try again.",
        });
      }

      return res.json({
        success: true,
        message:
          "A new login verification code has been sent to your email.",
        email:
          getMaskedEmail(
            user.email
          ),
        verificationEmail: user.email,
        expiresIn: 600,
        resendAvailableIn: 60,
      });
    } catch (error) {
      console.error(
        "Resend login verification error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to resend login verification code",
      });
    }
  }
);

// =====================================================
// FORGOT PASSWORD
// =====================================================

router.post(
  "/forgot-password",
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "Email address is required",
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const user =
        await User.findOne({
          email: cleanEmail,
        });

      if (!user) {
        return res.json({
          success: true,
          message:
            "If an account exists with that email, a password reset code has been sent.",
        });
      }

      const resetCode =
        generateSixDigitCode();

      const hashedResetCode =
        hashCode(resetCode);

      const resetCodeExpires =
        new Date(
          Date.now() + 10 * 60 * 1000
        );

      user.passwordResetCode =
        hashedResetCode;

      user.passwordResetCodeExpires =
        resetCodeExpires;

      user.passwordResetToken = "";
      user.passwordResetExpires = null;

      await user.save();

      try {
        await sendPasswordResetCodeEmail(
          cleanEmail,
          resetCode
        );
      } catch (emailError) {
        console.error(
          "Password reset email failed:",
          emailError.message
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to send password reset email. Please try again.",
        });
      }

      return res.json({
        success: true,
        message:
          "If an account exists with that email, a password reset code has been sent.",
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
  }
);

// =====================================================
// RESET PASSWORD WITH 6-DIGIT CODE
// =====================================================

router.post(
  "/reset-password",
  async (req, res) => {
    try {
      const {
        email,
        code,
        newPassword,
      } = req.body;

      if (
        !email ||
        !code ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email address, reset code and new password are required",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const cleanCode =
        String(code).trim();

      if (!/^\d{6}$/.test(cleanCode)) {
        return res.status(400).json({
          success: false,
          message:
            "Reset code must be 6 digits",
        });
      }

      if (!isStrongPassword(newPassword)) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 8 characters and include uppercase, lowercase, number and special character",
        });
      }

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or expired reset code",
        });
      }

      if (
        !user.passwordResetCode ||
        !user.passwordResetCodeExpires
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or expired reset code",
        });
      }

      if (
        new Date(
          user.passwordResetCodeExpires
        ).getTime() <= Date.now()
      ) {
        user.passwordResetCode = "";
        user.passwordResetCodeExpires =
          null;

        await user.save();

        return res.status(400).json({
          success: false,
          message:
            "Reset code has expired",
        });
      }

      const hashedCode =
        hashCode(cleanCode);

      if (
        hashedCode !==
        user.passwordResetCode
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid reset code",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          12
        );

      user.password =
        hashedPassword;

      user.passwordResetCode = "";
      user.passwordResetCodeExpires =
        null;

      user.passwordResetToken = "";
      user.passwordResetExpires = null;

      /*
       * Requiring verification again after
       * a password reset is safer.
       */
      user.trustedDevices = [];

      await user.save();

      return res.json({
        success: true,
        message:
          "Password reset successfully. You can now log in.",
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
  }
);

// =====================================================
// GET CURRENT USER
// =====================================================

router.get(
  "/me",
  protect,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.userId
        ).select(
          "-password -passwordResetToken -passwordResetExpires -passwordResetCode -passwordResetCodeExpires -emailVerificationCode -emailVerificationCodeExpires -loginVerificationCode -loginVerificationCodeExpires -loginVerificationAttempts -loginVerificationLastSentAt -trustedDevices"
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
  }
);

// =====================================================
// LOGOUT
// =====================================================

router.post(
  "/logout",
  (req, res) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
    });

    /*
     * We intentionally keep the trusted-device
     * cookie during normal logout.
     *
     * This allows the same browser to log back
     * in without another code during its remaining
     * one-hour trusted period.
     */

    return res.json({
      success: true,
      message:
        "Logged out successfully",
    });
  }
);

// =====================================================
// GOOGLE LOGIN
// =====================================================

router.post(
  "/google",
  async (req, res) => {
    try {
      const { credential } =
        req.body;

      if (!credential) {
        return res.status(400).json({
          success: false,
          message:
            "Google credential is required",
        });
      }

      const ticket =
        await googleClient.verifyIdToken(
          {
            idToken: credential,
            audience:
              process.env.GOOGLE_CLIENT_ID,
          }
        );

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

      const cleanEmail =
        email.trim().toLowerCase();

      let user =
        await User.findOne({
          $or: [
            { googleId },
            { email: cleanEmail },
          ],
        });

      if (user) {
        if (
          user.status === "suspended"
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Your account has been suspended. Please contact Vendora support.",
          });
        }

        if (!user.googleId) {
          user.googleId = googleId;
        }

        if (
          !user.profileImage &&
          picture
        ) {
          user.profileImage =
            picture;
        }

        user.emailVerified = true;

        user.emailVerificationCode =
          "";

        user.emailVerificationCodeExpires =
          null;

        await user.save();
      } else {
        const randomPassword =
          `${googleId}-${Date.now()}-${Math.random()}`;

        const hashedPassword =
          await bcrypt.hash(
            randomPassword,
            12
          );

        user =
          await User.create({
            name:
              name ||
              "Vendora User",

            email:
              cleanEmail,

            emailVerified: true,

            googleId,

            profileImage:
              picture || "",

            password:
              hashedPassword,

            role: "buyer",
          });
      }

      /*
       * Google has already verified the user's
       * Google identity.
       *
       * Vendora still checks its own trusted-device
       * security before creating a Vendora session.
       */

      cleanExpiredTrustedDevices(user);

      const deviceToken =
        req.cookies[TRUSTED_DEVICE_COOKIE];

      const trusted =
        isTrustedDevice(
          user,
          deviceToken
        );

      if (trusted) {
        const deviceTokenHash =
          hashTrustedDeviceToken(
            deviceToken
          );

        const trustedDevice =
          user.trustedDevices.find(
            (device) =>
              device.tokenHash ===
              deviceTokenHash
          );

        if (trustedDevice) {
          trustedDevice.lastUsedAt =
            new Date();

          await user.save();
        }

        const response =
          issueGoogleSuccessfulLogin(
            res,
            user
          );

        return res.json(response);
      }

      const now = Date.now();

      if (
        user.loginVerificationLastSentAt &&
        now -
          new Date(
            user.loginVerificationLastSentAt
          ).getTime() <
          LOGIN_CODE_RESEND_COOLDOWN_MS &&
        user.loginVerificationCode &&
        user.loginVerificationCodeExpires &&
        new Date(
          user.loginVerificationCodeExpires
        ).getTime() > now
      ) {
        const remainingSeconds =
          Math.ceil(
            (
              LOGIN_CODE_RESEND_COOLDOWN_MS -
              (
                now -
                new Date(
                  user.loginVerificationLastSentAt
                ).getTime()
              )
            ) / 1000
          );

        return res.status(200).json({
          success: true,
          requiresLoginVerification: true,
          message:
            "A login verification code has already been sent to your email.",
          email: getMaskedEmail(
            user.email
          ),
          verificationEmail: user.email,
          resendAvailableIn:
            Math.max(
              remainingSeconds,
              1
            ),
        });
      }

      try {
        await sendLoginVerificationCode(
          user
        );
      } catch (emailError) {
        console.error(
          "Google login verification email failed:",
          emailError.message
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to send login verification code. Please try again.",
        });
      }

      return res.status(200).json({
        success: true,
        requiresLoginVerification: true,
        message:
          "A 6-digit verification code has been sent to your email.",
        email: getMaskedEmail(
          user.email
        ),
        verificationEmail: user.email,
        expiresIn: 600,
        resendAvailableIn: 60,
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
  }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;