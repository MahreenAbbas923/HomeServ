const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── Protect: verify access token ───────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: { code: "TOKEN_MISSING", message: "Access token is required" },
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      const code = err.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID";
      return res.status(401).json({
        success: false,
        error: { code, message: err.message },
      });
    }

    const user = await User.findById(decoded.userId).select("+refreshTokens");
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: "TOKEN_INVALID", message: "User no longer exists or is inactive" },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// ─── Authorize: restrict to specific roles ───────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Role '${req.user.role}' is not authorized to access this resource`,
        },
      });
    }
    next();
  };
};

module.exports = { protect, authorize };