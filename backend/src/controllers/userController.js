const User = require("../models/User");

// ─── Helper: validate phone (basic) ──────────────────────────────────────────
const isValidPhone = (phone) => /^\+?[\d\s\-().]{7,20}$/.test(phone);

// ─── @desc    Get own profile
// ─── @route   GET /api/users/me
// ─── @access  Protected — any authenticated user
const getMe = async (req, res) => {
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
    console.error(`Error in getMe:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Update own profile (partial update)
// ─── @route   PATCH /api/users/me
// ─── @access  Protected — any authenticated user
const updateMe = async (req, res) => {
  try {
    const { name, phone, city, avatar } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (city !== undefined) updates.city = city.trim();
    if (avatar !== undefined) updates.avatar = avatar.trim();

    const updatedUser = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });

    return res.status(200).json({
      success: true,
      message: "Profile updated",
      data: updatedUser
    });
  } catch (error) {
    console.error(`Error in updateMe:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Change own password
// ─── @route   PATCH /api/users/me/password
// ─── @access  Protected — any authenticated user
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: "Wrong current password" });

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated" });
  } catch (error) {
    console.error(`Error in changePassword:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Soft-delete / deactivate own account
// ─── @route   DELETE /api/users/me
// ─── @access  Protected — any authenticated user
const deleteMe = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { isActive: false } });
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    return res.status(200).json({ success: true, message: "Account deactivated" });
  } catch (error) {
    console.error(`Error in deleteMe:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Get any user's profile by ID
// ─── @route   GET /api/users/:userId
// ─── @access  Protected — Admin only
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(`Error in getUserById:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

module.exports = {
  getMe,
  updateMe,
  changePassword,
  deleteMe,
  getUserById,
};