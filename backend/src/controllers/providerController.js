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
const getProviders = async (req, res, next) => {
  try {
    const {
      city,
      category,
      minRating,
      page  = 1,
      limit = 20,
    } = req.query;

    const filter = { isApproved: true };

    // City filter (serviceAreas array)
    if (city) {
      filter.serviceAreas = { $regex: new RegExp(city, "i") };
    }

    // Specialization / category filter
    if (category) {
      filter.specializations = { $regex: new RegExp(category, "i") };
    }

    // Minimum rating filter
    if (minRating) {
      filter.avgRating = { $gte: Number(minRating) };
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [profiles, total] = await Promise.all([
      ProviderProfile.find(filter)
        .sort({ avgRating: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("user", "name avatar city isVerified"),
      ProviderProfile.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page:  pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      data: profiles.map((p) => ({
        providerId:      p._id,
        userId:          p.user?._id,
        name:            p.user?.name,
        avatar:          p.user?.avatar || null,
        bio:             p.bio,
        specializations: p.specializations,
        city:            p.user?.city,
        avgRating:       p.avgRating,
        completedJobs:   p.completedJobs,
        isVerified:      p.user?.isVerified || false,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Get full profile of a single provider
// ─── @route   GET /api/providers/:providerId
// ─── @access  Public
const getProviderById = async (req, res, next) => {
  try {
    const profile = await ProviderProfile.findById(req.params.providerId)
      .populate("user", "name avatar city phone email isVerified");

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: "PROVIDER_NOT_FOUND", message: "No provider found with this ID" },
      });
    }

    // Fetch this provider's active service listings
    const services = await Service.find({ provider: profile.user._id, isActive: true })
      .populate("category", "name")
      .select("title description basePrice pricingType avgRating reviewCount images");

    return res.status(200).json({
      success: true,
      data: {
        providerId:      profile._id,
        userId:          profile.user?._id,
        name:            profile.user?.name,
        email:           profile.user?.email,
        phone:           profile.user?.phone,
        avatar:          profile.user?.avatar || null,
        city:            profile.user?.city,
        isVerified:      profile.user?.isVerified || false,
        bio:             profile.bio,
        specializations: profile.specializations,
        experience:      profile.experience,
        serviceAreas:    profile.serviceAreas,
        portfolio:       profile.portfolio,
        certifications:  profile.certifications,
        availability:    profile.availability,
        avgRating:       profile.avgRating,
        completedJobs:   profile.completedJobs,
        services:        services.map((s) => ({
          serviceId:   s._id,
          title:       s.title,
          description: s.description,
          category:    s.category?.name,
          basePrice:   s.basePrice,
          pricingType: s.pricingType,
          avgRating:   s.avgRating,
          reviewCount: s.reviewCount,
          images:      s.images,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Update own provider profile (full replace of sub-docs)
// ─── @route   PUT /api/providers/me
// ─── @access  Provider only
const updateMyProfile = async (req, res, next) => {
  try {
    const {
      bio,
      specializations,
      experience,
      serviceAreas,
      portfolio,
      certifications,
      availability,
    } = req.body;

    // Find this provider's profile
    let profile = await ProviderProfile.findOne({ user: req.user._id });

    // Create a blank profile if somehow it doesn't exist (safety net)
    if (!profile) {
      profile = await ProviderProfile.create({ user: req.user._id });
    }

    const updates = {};

    // ── bio ──
    if (bio !== undefined) {
      updates.bio = bio.trim();
    }

    // ── specializations ──
    if (specializations !== undefined) {
      if (!Array.isArray(specializations) || specializations.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "specializations must be a non-empty array" },
        });
      }
      updates.specializations = specializations.map((s) => s.trim()).filter(Boolean);
    }

    // ── experience ──
    if (experience !== undefined) {
      const exp = parseInt(experience);
      if (isNaN(exp) || exp < 0) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "experience must be a non-negative integer (years)" },
        });
      }
      updates.experience = exp;
    }

    // ── serviceAreas ──
    if (serviceAreas !== undefined) {
      if (!Array.isArray(serviceAreas)) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "serviceAreas must be an array of city names" },
        });
      }
      updates.serviceAreas = serviceAreas.map((s) => s.trim()).filter(Boolean);
    }

    // ── portfolio ──
    if (portfolio !== undefined) {
      if (!Array.isArray(portfolio)) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "portfolio must be an array" },
        });
      }
      for (const item of portfolio) {
        if (!item.title) {
          return res.status(400).json({
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Each portfolio item must have a title" },
          });
        }
      }
      updates.portfolio = portfolio;
    }

    // ── certifications ──
    if (certifications !== undefined) {
      if (!Array.isArray(certifications)) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "certifications must be an array" },
        });
      }
      for (const cert of certifications) {
        if (!cert.name || !cert.issuedBy) {
          return res.status(400).json({
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Each certification must have name and issuedBy" },
          });
        }
      }
      updates.certifications = certifications;
    }

    // ── availability ──
    if (availability !== undefined) {
      if (typeof availability !== "object" || Array.isArray(availability)) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "availability must be an object with day keys" },
        });
      }

      const validatedAvailability = {};
      for (const day of DAYS) {
        if (availability[day] !== undefined) {
          const dayData = availability[day];

          // If marked available, validate time format
          if (dayData.available === true) {
            if (!TIME_REGEX.test(dayData.from) || !TIME_REGEX.test(dayData.to)) {
              return res.status(400).json({
                success: false,
                error: {
                  code: "VALIDATION_ERROR",
                  message: `Invalid time format for ${day}. Use HH:MM (e.g. 09:00)`,
                },
              });
            }
            if (toMinutes(dayData.from) >= toMinutes(dayData.to)) {
              return res.status(400).json({
                success: false,
                error: {
                  code: "VALIDATION_ERROR",
                  message: `'from' time must be before 'to' time for ${day}`,
                },
              });
            }
          }

          validatedAvailability[day] = {
            available: Boolean(dayData.available),
            from:      dayData.from || "09:00",
            to:        dayData.to   || "17:00",
          };
        }
      }

      // Merge with existing availability (only update provided days)
      updates.availability = {
        ...profile.availability.toObject(),
        ...validatedAvailability,
      };
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "No valid fields provided to update" },
      });
    }

    const updatedProfile = await ProviderProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("user", "name avatar city email phone isVerified");

    return res.status(200).json({
      success: true,
      message: "Provider profile updated successfully",
      data: {
        providerId:      updatedProfile._id,
        userId:          updatedProfile.user?._id,
        name:            updatedProfile.user?.name,
        avatar:          updatedProfile.user?.avatar || null,
        city:            updatedProfile.user?.city,
        bio:             updatedProfile.bio,
        specializations: updatedProfile.specializations,
        experience:      updatedProfile.experience,
        serviceAreas:    updatedProfile.serviceAreas,
        portfolio:       updatedProfile.portfolio,
        certifications:  updatedProfile.certifications,
        availability:    updatedProfile.availability,
        avgRating:       updatedProfile.avgRating,
        completedJobs:   updatedProfile.completedJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Check provider availability for a specific date
// ─── @route   GET /api/providers/:providerId/availability
// ─── @access  Public
const getProviderAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;

    // ── Validate date query param ──
    if (!date) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_DATE", message: "date query parameter is required (YYYY-MM-DD)" },
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_DATE", message: "Invalid date format. Use YYYY-MM-DD" },
      });
    }

    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_DATE", message: "Invalid date value" },
      });
    }

    // Strip time for comparison (compare date only)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    requestedDate.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_DATE", message: "Date cannot be in the past" },
      });
    }

    // ── Fetch provider profile ──
    const profile = await ProviderProfile.findById(req.params.providerId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: "PROVIDER_NOT_FOUND", message: "No provider found with this ID" },
      });
    }

    // ── Get the day of week for the requested date ──
    const dayKey = getDayKey(new Date(date));
    const daySchedule = profile.availability?.[dayKey];

    if (!daySchedule || !daySchedule.available) {
      return res.status(200).json({
        success: true,
        data: {
          date,
          availableSlots: [],
          message: `Provider is not available on ${dayKey}s`,
        },
      });
    }

    // ── Generate all hourly slots for the day ──
    const allSlots = generateSlots(daySchedule.from, daySchedule.to);

    // ── Remove already-booked slots ──
    // TODO: Uncomment when Booking model is ready
    // const Booking = require("../models/Booking");
    // const bookedSlots = await Booking.find({
    //   provider: profile.user,
    //   scheduledDate: date,
    //   status: { $in: ["pending", "confirmed", "in_progress"] },
    // }).select("scheduledTime");
    // const bookedTimes = bookedSlots.map((b) => b.scheduledTime);
    // const availableSlots = allSlots.filter((slot) => !bookedTimes.includes(slot));

    const availableSlots = allSlots; // remove this line once Booking check is wired

    return res.status(200).json({
      success: true,
      data: {
        date,
        availableSlots,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProviders,
  getProviderById,
  updateMyProfile,
  getProviderAvailability,
};