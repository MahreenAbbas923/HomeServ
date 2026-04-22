const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Service title is required"],
      trim: true,
      minlength: [5,   "Title must be at least 5 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Service description is required"],
      trim: true,
      minlength: [20,   "Description must be at least 20 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: [true, "Category is required"],
    },
    // The provider (User with role='provider') who owns this listing
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Provider is required"],
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [1, "Price must be greater than 0"],
    },
    pricingType: {
      type: String,
      enum: ["fixed", "hourly", "quote"],
      required: [true, "Pricing type is required"],
    },
    images: {
      type: [String],   // array of URLs
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "A maximum of 5 images are allowed per service",
      },
    },
    // Computed / denormalised — updated when reviews come in
    avgRating:   { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },  // soft-delete flag
  },
  { timestamps: true }
);

// ── Index for fast filtered browsing ─────────────────────────────────────────
serviceSchema.index({ category: 1 });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ isActive: 1, avgRating: -1 });

module.exports = mongoose.model("Service", serviceSchema);