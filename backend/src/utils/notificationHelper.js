const Notification = require('../models/Notification');

exports.createNotification = async ({ userId, type, title, message, relatedId }) => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId
    });
  } catch (error) {
    console.error('Notification creation failed:', error);
  }
};
