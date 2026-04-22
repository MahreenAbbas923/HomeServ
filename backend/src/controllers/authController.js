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
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, city } = req.body;

    if (!name || !email || !password || !phone || !role || !city) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "All fields are required" },
      });
    }

    // ... (logic) ...
    const otp = generateOtp();
    const user = await User.create({
      name, email, password, phone, role, city,
      emailOtp: { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }
    });

    if (role === "provider") await ProviderProfile.create({ user: user._id });

    console.log(`📧 [DEV] OTP for ${email}: ${otp}`);

    return res.status(201).json({ success: true, message: "Registration successful", data: { userId: user._id } });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// ─── @desc    Login user
// ─── @route   POST /api/auth/login
// ─── @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Issue tokens ...
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password +loginAttempts +loginLockUntil +refreshTokens");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (!user.isVerified) return res.status(403).json({ success: false, message: "Please verify email" });

    const accessToken = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id);

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    await user.save({ validateModifiedOnly: true });

    sendRefreshCookie(res, refreshToken);
    res.status(200).json({ success: true, data: { accessToken, user } });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Refresh access token using refresh token cookie
// ─── @route   POST /api/auth/refresh
// ─── @access  Refresh token cookie
const refresh = async (req, res) => {
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
    console.error(`Error in refresh:`, error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message
      }
    });
  }
};

// ─── @desc    Verify email address with OTP
// ─── @route   POST /api/auth/verify-email
// ─── @access  Public
const verifyEmail = async (req, res) => {
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

    if (!user.emailOtp?.code || user.emailOtp.code.toString() !== otp.toString().trim()) {
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
    console.error(`Error in verifyEmail:`, error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message
      }
    });
  }
};

// ─── @desc    Resend email verification OTP
// ─── @route   POST /api/auth/resend-otp
// ─── @access  Public
const resendOtp = async (req, res) => {
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
    console.error(`Error in resendOtp:`, error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message
      }
    });
  }
};

// ─── @desc    Request password reset link
// ─── @route   POST /api/auth/forgot-password
// ─── @access  Public
const forgotPassword = async (req, res) => {
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
    console.error(`Error in forgotPassword:`, error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message
      }
    });
  }
};

// ─── @desc    Reset password using token from email
// ─── @route   POST /api/auth/reset-password
// ─── @access  Public
const resetPassword = async (req, res) => {
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
    console.error(`Error in resetPassword:`, error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message
      }
    });
  }
};

// ─── @desc    Logout — invalidate refresh token and clear cookie
// ─── @route   POST /api/auth/logout
// ─── @access  Protected (Bearer token)
const logout = async (req, res) => {
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
    console.error(`Error in logout:`, error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message
      }
    });
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