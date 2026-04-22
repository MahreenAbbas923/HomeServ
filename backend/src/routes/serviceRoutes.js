const express = require("express");
const router = express.Router();

const {
  getCategories,
  createCategory,
  getServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ── Category routes ───────────────────────────────────────────────────────────

// @route   GET  /api/services/categories
// @desc    List all active service categories
// @access  Public
router.get("/categories", getCategories);

// @route   POST /api/services/categories
// @desc    Create a new category
// @access  Admin only
// NOTE: this route must be defined BEFORE /:serviceId to avoid conflict
router.post("/categories", protect, authorize("admin"), createCategory);

// ── Service listing routes ────────────────────────────────────────────────────

// @route   GET  /api/services
// @desc    Browse all active services with filters & pagination
// @access  Public
router.get("/", getServices);

// @route   POST /api/services
// @desc    Create a new service listing
// @access  Provider only
router.post("/", protect, authorize("provider"), createService);

// @route   GET  /api/services/:serviceId
// @desc    Get details of a single service
// @access  Public
router.get("/:serviceId", getServiceById);

// @route   PATCH /api/services/:serviceId
// @desc    Update a service listing (partial)
// @access  Owning Provider or Admin
router.patch("/:serviceId", protect, authorize("provider", "admin"), updateService);

// @route   DELETE /api/services/:serviceId
// @desc    Soft-delete a service listing
// @access  Owning Provider or Admin
router.delete("/:serviceId", protect, authorize("provider", "admin"), deleteService);

module.exports = router;