const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    // First try the secure HttpOnly cookie
    let token = req.cookies.token;

    // Fallback: allow Authorization: Bearer <token>
    // This helps browsers where the cross-origin cookie
    // is not available.
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
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

module.exports = protect;