const Notification = require('../models/Notification');

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort('-createdAt');
    return res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    console.error(`Error in getMyNotifications:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread/count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error(`Error in getUnreadCount:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Mark as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: "Not found" });
    
    notification.isRead = true;
    await notification.save();
    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error(`Error in markAsRead:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, message: "All read" });
  } catch (error) {
    console.error(`Error in markAllRead:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error(`Error in deleteNotification:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};
