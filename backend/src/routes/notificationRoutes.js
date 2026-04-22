const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyNotifications);
router.get('/unread/count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllRead);
router.delete('/:id', deleteNotification);

module.exports = router;
