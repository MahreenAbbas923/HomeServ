const express = require('express');
const router = express.Router();
const {
  createReview,
  getUserReviews,
  getServiceReviews,
  getBidReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/user/:userId', getUserReviews);
router.get('/service/:serviceId', getServiceReviews);
router.get('/bid/:bidId', protect, getBidReview);

module.exports = router;
