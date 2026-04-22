const User = require("../models/User");

// ─── Helper: validate phone (basic) ──────────────────────────────────────────
const isValidPhone = (phone) => /^\+?[\d\s\-().]{7,20}$/.test(phone);

// ─── @desc    Get own profile
// ─── @route   GET /api/users/me
// ─── @access  Protected — any authenticated user
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId:     user._id,
        name:       user.name,
        email:      user.email,
        phone:      user.phone,
        role:       user.role,
        city:       user.city,
        avatar:     user.avatar || null,
        isVerified: user.isVerified,
        createdAt:  user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Update own profile (partial update)
// ─── @route   PATCH /api/users/me
// ─── @access  Protected — any authenticated user
const updateMe = async (req, res, next) => {
  try {
    const { name, phone, city, avatar } = req.body;

    // Build update object with only provided fields
    const updates = {};

    if (name !== undefined) {
      const trimmed = name.trim();
      if (trimmed.length < 2 || trimmed.length > 100) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Name must be between 2 and 100 characters" },
        });
      }
      updates.name = trimmed;
    }

    if (phone !== undefined) {
      const trimmed = phone.trim();
      if (!isValidPhone(trimmed)) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid phone number format" },
        });
      }
      // Check if phone is taken by another user
      const phoneTaken = await User.findOne({
        phone: trimmed,
        _id: { $ne: req.user._id },
      });
      if (phoneTaken) {
        return res.status(409).json({
          success: false,
          error: { code: "PHONE_TAKEN", message: "This phone number is already registered to another account" },
        });
      }
      updates.phone = trimmed;
    }

    if (city !== undefined) {
      updates.city = city.trim();
    }

    if (avatar !== undefined) {
      updates.avatar = avatar.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "No valid fields provided to update" },
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        userId:     updatedUser._id,
        name:       updatedUser.name,
        email:      updatedUser.email,
        phone:      updatedUser.phone,
        role:       updatedUser.role,
        city:       updatedUser.city,
        avatar:     updatedUser.avatar || null,
        isVerified: updatedUser.isVerified,
        createdAt:  updatedUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Change own password
// ─── @route   PATCH /api/users/me/password
// ─── @access  Protected — any authenticated user
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "currentPassword and newPassword are required" },
      });
    }

    // Validate new password strength
    const isStrong = /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword);
    if (!isStrong) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "New password must be at least 8 characters with 1 uppercase letter and 1 number",
        },
      });
    }

    // Fetch user with password field
    const user = await User.findById(req.user._id).select("+password +refreshTokens");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: "WRONG_PASSWORD", message: "Current password is incorrect" },
      });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    // Invalidate all refresh tokens so other devices are logged out
    user.refreshTokens = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again on other devices.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Soft-delete / deactivate own account
// ─── @route   DELETE /api/users/me
// ─── @access  Protected — any authenticated user
const deleteMe = async (req, res, next) => {
  try {
    // TODO: When Booking model is ready, uncomment this check:
    // const Booking = require("../models/Booking");
    // const activeBookings = await Booking.findOne({
    //   $or: [{ customer: req.user._id }, { provider: req.user._id }],
    //   status: { $in: ["pending", "confirmed", "in_progress"] },
    // });
    // if (activeBookings) {
    //   return res.status(409).json({
    //     success: false,
    //     error: {
    //       code: "ACTIVE_BOOKINGS",
    //       message: "You have pending or active bookings. Please resolve them before deleting your account.",
    //     },
    //   });
    // }

    await User.findByIdAndUpdate(req.user._id, {
      $set: { isActive: false },
      $unset: { refreshTokens: "" },
    });

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/api/auth/refresh",
    });

    return res.status(200).json({
      success: true,
      message: "Account deactivated. Your data will be retained for 30 days for dispute resolution.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Get any user's profile by ID
// ─── @route   GET /api/users/:userId
// ─── @access  Protected — Admin only
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "No user found with this ID" },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId:     user._id,
        name:       user.name,
        email:      user.email,
        phone:      user.phone,
        role:       user.role,
        city:       user.city,
        avatar:     user.avatar || null,
        isVerified: user.isVerified,
        isActive:   user.isActive,
        createdAt:  user.createdAt,
        updatedAt:  user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
  changePassword,
  deleteMe,
  getUserById,
};