const mongoose = require("mongoose");

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const dayAvailabilitySchema = new mongoose.Schema(
  {
    available: { type: Boolean, default: false },
    from:      { type: String, default: "09:00" }, // HH:MM
    to:        { type: String, default: "17:00" }, // HH:MM
  },
  { _id: false }
);

const portfolioItemSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    imageUrl:    { type: String, default: null },
    description: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const certificationSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    issuedBy: { type: String, required: true, trim: true },
    year:     {
      type: Number,
      min: [1970, "Year seems too old"],
      max: [new Date().getFullYear(), "Year cannot be in the future"],
    },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const providerProfileSchema = new mongoose.Schema(
  {
    // One-to-one link with User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
      default: "",
    },

    specializations: {
      type: [String],   // e.g. ["Plumbing", "Pipe Fitting"]
      default: [],
    },

    experience: {
      type: Number,     // years of experience
      min: [0, "Experience cannot be negative"],
      default: 0,
    },

    serviceAreas: {
      type: [String],   // city names where provider operates
      default: [],
    },

    portfolio: {
      type: [portfolioItemSchema],
      default: [],
    },

    certifications: {
      type: [certificationSchema],
      default: [],
    },

    // Weekly availability schedule
    availability: {
      monday:    { type: dayAvailabilitySchema, default: () => ({}) },
      tuesday:   { type: dayAvailabilitySchema, default: () => ({}) },
      wednesday: { type: dayAvailabilitySchema, default: () => ({}) },
      thursday:  { type: dayAvailabilitySchema, default: () => ({}) },
      friday:    { type: dayAvailabilitySchema, default: () => ({}) },
      saturday:  { type: dayAvailabilitySchema, default: () => ({}) },
      sunday:    { type: dayAvailabilitySchema, default: () => ({}) },
    },

    // Admin approval status
    isApproved: {
      type: Boolean,
      default: false,
    },

    // Computed stats — updated by booking/review events
    avgRating:     { type: Number, default: 0, min: 0, max: 5 },
    completedJobs: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// ── Index for filtered browsing ───────────────────────────────────────────────
providerProfileSchema.index({ serviceAreas: 1 });
providerProfileSchema.index({ specializations: 1 });
providerProfileSchema.index({ avgRating: -1 });
providerProfileSchema.index({ isApproved: 1 });

module.exports = mongoose.model("ProviderProfile", providerProfileSchema);