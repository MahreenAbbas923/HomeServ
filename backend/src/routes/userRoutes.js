const express = require("express");
const router = express.Router();

const {
  getMe,
  updateMe,
  changePassword,
  deleteMe,
  getUserById,
} = require("../controllers/userController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All /api/users routes require authentication
router.use(protect);

// ── Own profile routes ────────────────────────────────────────────────────────

// @route   GET /api/users/me
// @desc    Get own profile
// @access  Any authenticated user
router.get("/me", getMe);

// @route   PATCH /api/users/me
// @desc    Update own profile (partial — name, phone, city, avatar)
// @access  Any authenticated user
router.patch("/me", updateMe);

// @route   PATCH /api/users/me/password
// @desc    Change own password
// @access  Any authenticated user
router.patch("/me/password", changePassword);

// @route   DELETE /api/users/me
// @desc    Soft-delete / deactivate own account
// @access  Any authenticated user
router.delete("/me", deleteMe);

// ── Admin routes ──────────────────────────────────────────────────────────────

// @route   GET /api/users/:userId
// @desc    Get any user's full profile
// @access  Admin only
router.get("/:userId", authorize("admin"), getUserById);

module.exports = router;