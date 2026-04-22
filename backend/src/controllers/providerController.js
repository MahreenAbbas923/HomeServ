const ProviderProfile = require("../models/ProviderProfile");
const Service         = require("../models/Service");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;   // HH:MM 00:00–23:59

/** Convert "HH:MM" to total minutes for comparison */
const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Generate hourly slots between from & to (e.g. "09:00" → "17:00") */
const generateSlots = (from, to) => {
  const slots = [];
  let current = toMinutes(from);
  const end   = toMinutes(to);
  while (current < end) {
    const h = String(Math.floor(current / 60)).padStart(2, "0");
    const m = String(current % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += 60;
  }
  return slots;
};

/** Map JS Date.getDay() (0=Sun) to our day key */
const getDayKey = (date) => {
  const map = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return map[date.getDay()];
};

// ════════════════════════════════════════════════════════════════════════════
//  ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// ─── @desc    Browse provider profiles with filters & pagination
// ─── @route   GET /api/providers
// ─── @access  Public
const getProviders = async (req, res) => {
  try {
    const { city, category, minRating, page = 1, limit = 20 } = req.query;
    const filter = { isApproved: true };

    if (city) filter.serviceAreas = { $regex: new RegExp(city, "i") };
    if (category) filter.specializations = { $regex: new RegExp(category, "i") };
    if (minRating) filter.avgRating = { $gte: Number(minRating) };

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [profiles, total] = await Promise.all([
      ProviderProfile.find(filter).sort({ avgRating: -1 }).skip(skip).limit(limitNum).populate("user", "name avatar city isVerified"),
      ProviderProfile.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, pagination: { page: pageNum, limit: limitNum, total }, data: profiles });
  } catch (error) {
    console.error(`Error in getProviders:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Get full profile of a single provider
// ─── @route   GET /api/providers/:providerId
// ─── @access  Public
const getProviderById = async (req, res) => {
  try {
    const profile = await ProviderProfile.findById(req.params.providerId).populate("user").lean();
    if (!profile) return res.status(404).json({ success: false, message: "Not found" });

    const services = await Service.find({ provider: profile.user._id, isActive: true });
    return res.status(200).json({ success: true, data: { ...profile, services } });
  } catch (error) {
    console.error(`Error in getProviderById:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Update own provider profile (full replace of sub-docs)
// ─── @route   PUT /api/providers/me
// ─── @access  Provider only
const updateMyProfile = async (req, res) => {
  try {
    const updated = await ProviderProfile.findOneAndUpdate({ user: req.user._id }, { $set: req.body }, { new: true });
    return res.status(200).json({ success: true, message: "Profile updated", data: updated });
  } catch (error) {
    console.error(`Error in updateMyProfile:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Check provider availability for a specific date
// ─── @route   GET /api/providers/:providerId/availability
// ─── @access  Public
const getProviderAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: "Date required" });

    const profile = await ProviderProfile.findById(req.params.providerId);
    if (!profile) return res.status(404).json({ success: false, message: "Not found" });

    const dayKey = getDayKey(new Date(date));
    const slots = generateSlots(profile.availability?.[dayKey]?.from || "09:00", profile.availability?.[dayKey]?.to || "17:00");

    return res.status(200).json({ success: true, data: { date, availableSlots: slots } });
  } catch (error) {
    console.error(`Error in getProviderAvailability:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

module.exports = {
  getProviders,
  getProviderById,
  updateMyProfile,
  getProviderAvailability,
};