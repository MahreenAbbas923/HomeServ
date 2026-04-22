const express = require('express');
const router = express.Router();
const {
  submitBid,
  getRequestBids,
  getMyBids,
  acceptBid,
  rejectBid,
  completeJob
} = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('provider'), submitBid);
router.get('/request/:requestId', getRequestBids);
router.get('/my', authorize('provider'), getMyBids);
router.patch('/:id/accept', authorize('customer'), acceptBid);
router.patch('/:id/reject', authorize('customer'), rejectBid);
router.patch('/:id/complete', authorize('provider'), completeJob);

module.exports = router;
