const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ProviderProfile = require("../models/ProviderProfile");




/** Sign an access token (15 min) */
const signAccessToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

/** Sign a refresh token */
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

/** Validate password strength:  */
const isStrongPassword = (password) =>
  /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

//   Register new user

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
    const user = await User.create({
      name, email, password, phone, role, city,
      isVerified: true
    });

    if (role === "provider") await ProviderProfile.create({ user: user._id });

    console.log(`📧 [DEV] Registration complete, OTP bypassed for ${email}`);

    return res.status(201).json({ success: true, message: "Registration successful", data: { userId: user._id } });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hardcoded Admin Login
    if (email === "admin@gmail.com" && password === "admin123") {
      let adminUser = await User.findOne({ email: "admin@gmail.com" }).select("+refreshTokens");
      if (!adminUser) {
         adminUser = await User.create({
            name: "Super Admin",
            email: "admin@gmail.com",
            password: "admin123",
            phone: "00000000000",
            role: "admin",
            city: "Headquarters",
            isVerified: true
         });
      }

      const accessToken = signAccessToken(adminUser._id, adminUser.role);
      const refreshToken = signRefreshToken(adminUser._id);

      adminUser.refreshTokens = adminUser.refreshTokens || [];
      adminUser.refreshTokens.push(refreshToken);
      await adminUser.save({ validateModifiedOnly: true });

      sendRefreshCookie(res, refreshToken);
      return res.status(200).json({ success: true, data: { accessToken, user: adminUser } });
    }
    // Issue tokens ...
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password +loginAttempts +loginLockUntil +refreshTokens");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });


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



//  Request password reset link
//  @route   POST /api/auth/forgot-password

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

// Logout — invalidate refresh token and clear cookie
// POST /api/auth/logout

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
  forgotPassword,
  resetPassword,
  logout,
};