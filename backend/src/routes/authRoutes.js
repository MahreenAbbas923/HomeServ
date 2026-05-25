const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// route   POST /api/auth/register
// desc    Register a new user

router.post("/register", register);

// @route   POST /api/auth/login
// @desc    Login and get tokens

router.post("/login", login);

// @route   POST /api/auth/refresh
// @desc    Refresh access token using httpOnly cookie

router.post("/refresh", refresh);


// @route   POST /api/auth/forgot-password
// @desc    Send password reset link to email

router.post("/forgot-password", forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token received via email

router.post("/reset-password", resetPassword);

// @route   POST /api/auth/logout
// @desc    Invalidate refresh token and clear cookie

router.post("/logout", protect, logout);

module.exports = router;