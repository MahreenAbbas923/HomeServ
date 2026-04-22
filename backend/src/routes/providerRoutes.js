const express = require("express");
const router  = express.Router();

const {
  getProviders,
  getProviderById,
  updateMyProfile,
  getProviderAvailability,
} = require("../controllers/providerController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ── IMPORTANT: static routes must come before dynamic /:providerId routes ──

// @route   GET /api/providers
// @desc    Browse all approved provider profiles with filters & pagination
// @access  Public
router.get("/", getProviders);

// @route   PUT /api/providers/me
// @desc    Update own provider profile (bio, skills, availability, etc.)
// @access  Provider only
// NOTE: declared before /:providerId so "me" is not treated as an ObjectId
router.put("/me", protect, authorize("provider"), updateMyProfile);

// @route   GET /api/providers/:providerId
// @desc    Get full profile of a specific provider
// @access  Public
router.get("/:providerId", getProviderById);

// @route   GET /api/providers/:providerId/availability
// @desc    Get available time slots for a provider on a given date
// @access  Public  — query param: ?date=YYYY-MM-DD
router.get("/:providerId/availability", getProviderAvailability);

module.exports = router;