const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["customer", "provider", "admin"],
      required: [true, "Role is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    // ── New field added for Users module ──
    avatar: {
      type: String,   // URL or base64 string
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Email verification OTP
    emailOtp: {
      code:      { type: String },
      expiresAt: { type: Date },
    },
    // Password reset token
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
    // Refresh tokens (blacklisting on logout / password change)
    refreshTokens: { type: [String], select: false },
    // Failed login tracking
    loginAttempts:  { type: Number, default: 0, select: false },
    loginLockUntil: { type: Date,               select: false },
  },
  { timestamps: true }
);

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance: compare password ────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance: check if account is locked ─────────────────────────────────────
userSchema.methods.isLocked = function () {
  return this.loginLockUntil && this.loginLockUntil > Date.now();
};

module.exports = mongoose.model("User", userSchema);