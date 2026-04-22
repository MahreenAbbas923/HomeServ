const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ProviderProfile = require("../models/ProviderProfile");

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate a 6-digit OTP */
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/** Sign an access token (15 min) */
const signAccessToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

/** Sign a refresh token (7 days) */
const signRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

/** Send the refresh token as an httpOnly cookie */
const sendRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

/** Validate password strength: min 8 chars, 1 uppercase, 1 number */
const isStrongPassword = (password) =>
  /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

// ─── @desc    Register new user
// ─── @route   POST /api/auth/register
// ─── @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, city } = req.body;

    // ── Basic field validation ──
    if (!name || !email || !password || !phone || !role || !city) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "All fields are required: name, email, password, phone, role, city",
        },
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid email format" },
      });
    }

    if (!["customer", "provider"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Role must be 'customer' or 'provider'" },
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must be at least 8 characters with 1 uppercase letter and 1 number",
        },
      });
    }

    // ── Check duplicate email ──
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: "EMAIL_EXISTS", message: "An account with this email already exists" },
      });
    }

    // ── Generate OTP ──
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // ── Create user ──
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password,
      phone:    phone.trim(),
      role,
      city:     city.trim(),
      emailOtp: { code: otp, expiresAt: otpExpiresAt },
    });

    // ── If provider, auto-create a blank ProviderProfile ──
    if (role === "provider") {
      await ProviderProfile.create({ user: user._id });
    }

    // ── Send verification email ──
    // In production, plug in Nodemailer/SendGrid here.
    // For now we log the OTP so you can test via Postman.
    console.log(`📧 [DEV] OTP for ${email}: ${otp}`);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      data: {
        userId: user._id,
        name:   user.name,
        email:  user.email,
        role:   user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Login user
// ─── @route   POST /api/auth/login
// ─── @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Email and password are required" },
      });
    }

    // Fetch user with password and rate-limiting fields
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +loginAttempts +loginLockUntil +refreshTokens"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "No account found with this email" },
      });
    }

    // ── Rate limiting: check lock ──
    if (user.isLocked()) {
      const waitMinutes = Math.ceil((user.loginLockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Too many failed login attempts. Try again in ${waitMinutes} minute(s).`,
        },
      });
    }

    // ── Verify password ──
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.loginLockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock 15 min
        user.loginAttempts = 0;
      }
      await user.save({ validateModifiedOnly: true });

      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Incorrect password" },
      });
    }

    // ── Check email verified ──
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        error: { code: "EMAIL_NOT_VERIFIED", message: "Please verify your email before logging in" },
      });
    }

    // ── Reset failed attempts on success ──
    user.loginAttempts = 0;
    user.loginLockUntil = undefined;

    // ── Issue tokens ──
    const accessToken  = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id);

    // Store refresh token — keep only last 5 (multi-device support)
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) user.refreshTokens.shift();
    await user.save({ validateModifiedOnly: true });

    sendRefreshCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          userId:     user._id,
          name:       user.name,
          email:      user.email,
          role:       user.role,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Refresh access token using refresh token cookie
// ─── @route   POST /api/auth/refresh
// ─── @access  Refresh token cookie
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: "TOKEN_MISSING", message: "No refresh token found" },
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      const code = err.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID";
      return res.status(err.name === "TokenExpiredError" ? 401 : 403).json({
        success: false,
        error: { code, message: err.message },
      });
    }

    const user = await User.findById(decoded.userId).select("+refreshTokens");
    if (!user || !user.refreshTokens.includes(token)) {
      return res.status(403).json({
        success: false,
        error: { code: "TOKEN_INVALID", message: "Refresh token is invalid or was revoked" },
      });
    }

    // Rotate: remove old, issue new
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    const newRefreshToken = signRefreshToken(user._id);
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateModifiedOnly: true });

    sendRefreshCookie(res, newRefreshToken);

    const newAccessToken = signAccessToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Verify email address with OTP
// ─── @route   POST /api/auth/verify-email
// ─── @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Email and OTP are required" },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+emailOtp");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "No account found with this email" },
      });
    }

    if (user.isVerified) {
      return res.status(409).json({
        success: false,
        error: { code: "ALREADY_VERIFIED", message: "Email is already verified" },
      });
    }

    if (!user.emailOtp?.code || user.emailOtp.code !== otp.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_OTP", message: "The OTP you entered is incorrect" },
      });
    }

    if (user.emailOtp.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        error: { code: "OTP_EXPIRED", message: "OTP has expired. Please request a new one." },
      });
    }

    user.isVerified = true;
    user.emailOtp   = undefined;
    await user.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Resend email verification OTP
// ─── @route   POST /api/auth/resend-otp
// ─── @access  Public
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Email is required" },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+emailOtp");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "No account found with this email" },
      });
    }

    if (user.isVerified) {
      return res.status(409).json({
        success: false,
        error: { code: "ALREADY_VERIFIED", message: "Email is already verified" },
      });
    }

    const otp = generateOtp();
    user.emailOtp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save({ validateModifiedOnly: true });

    console.log(`📧 [DEV] New OTP for ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Request password reset link
// ─── @route   POST /api/auth/forgot-password
// ─── @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Always respond 200 to prevent user enumeration attacks
    if (!email) {
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      const rawToken    = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      user.passwordResetToken   = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save({ validateModifiedOnly: true });

      // TODO: In production replace console.log with Nodemailer/SendGrid email
      // Reset URL example: https://homeserv.com/reset-password?token=<rawToken>
      console.log(`🔑 [DEV] Password reset token for ${email}: ${rawToken}`);
    }

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Reset password using token from email
// ─── @route   POST /api/auth/reset-password
// ─── @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Token and newPassword are required" },
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must be at least 8 characters with 1 uppercase letter and 1 number",
        },
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        error: { code: "TOKEN_INVALID", message: "Invalid or already used reset token" },
      });
    }

    if (user.passwordResetExpires < new Date()) {
      return res.status(410).json({
        success: false,
        error: { code: "TOKEN_EXPIRED", message: "Reset token has expired. Please request a new one." },
      });
    }

    // Update password — pre-save hook will hash it automatically
    user.password             = newPassword;
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    // Invalidate all refresh tokens across all devices
    user.refreshTokens = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Logout — invalidate refresh token and clear cookie
// ─── @route   POST /api/auth/logout
// ─── @access  Protected (Bearer token)
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      const user = await User.findById(req.user._id).select("+refreshTokens");
      if (user) {
        user.refreshTokens = (user.refreshTokens || []).filter((t) => t !== token);
        await user.save({ validateModifiedOnly: true });
      }
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path:     "/api/auth/refresh",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  verifyEmail,
  resendOtp,
  forgotPassword,
  resetPassword,
  logout,
};