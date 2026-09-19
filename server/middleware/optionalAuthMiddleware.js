const jwt = require("jsonwebtoken");
const User = require("../models/User");

const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;

      if (
        authHeader &&
        authHeader.startsWith("Bearer ")
      ) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.userId
    ).select("status");

    if (!user) {
      return next();
    }

    if (user.status === "suspended") {
      return next();
    }

    req.user = decoded;

    next();
  } catch (error) {
    next();
  }
};

module.exports = optionalAuth;