const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refresh,
  verifyEmail,
  resendOtp,
  forgotPassword,
  resetPassword,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", register);

// @route   POST /api/auth/login
// @desc    Login and get tokens
// @access  Public
router.post("/login", login);

// @route   POST /api/auth/refresh
// @desc    Refresh access token using httpOnly cookie
// @access  Public (needs refresh token cookie)
router.post("/refresh", refresh);

// @route   POST /api/auth/verify-email
// @desc    Verify email address with 6-digit OTP
// @access  Public
router.post("/verify-email", verifyEmail);

// @route   POST /api/auth/resend-otp
// @desc    Resend email verification OTP
// @access  Public
router.post("/resend-otp", resendOtp);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset link to email
// @access  Public
router.post("/forgot-password", forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token received via email
// @access  Public
router.post("/reset-password", resetPassword);

// @route   POST /api/auth/logout
// @desc    Invalidate refresh token and clear cookie
// @access  Protected
router.post("/logout", protect, logout);

module.exports = router;