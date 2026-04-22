// ─── Global Error Handler ────────────────────────────────────────────────────
// Place this LAST in server.js: app.use(errorHandler)

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);
  if (process.env.NODE_ENV === "development") console.error(err.stack);

  // Mongoose duplicate key (e.g., unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_KEY",
        message: `An account with this ${field} already exists`,
      },
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: messages.join(". ") },
    });
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: `Invalid ${err.path}: ${err.value}` },
    });
  }

  // JWT errors (caught inside controllers, but as a fallback)
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: { code: "TOKEN_INVALID", message: "Invalid token" },
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: { code: "TOKEN_EXPIRED", message: "Token has expired" },
    });
  }

  // Generic fallback
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: "SERVER_ERROR",
      message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    },
  });
};

// ─── 404 handler — mount BEFORE errorHandler ────────────────────────────────
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};

module.exports = { errorHandler, notFound };