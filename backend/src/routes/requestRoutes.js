const express = require('express');
const router = express.Router();
const {
  createRequest,
  getOpenRequests,
  getMyRequests,
  getRequestById,
  cancelRequest
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .post(authorize('customer'), createRequest)
  .get(authorize('provider', 'admin', 'customer'), getOpenRequests);

router.get('/my', authorize('customer'), getMyRequests);

router.get('/:id', getRequestById);

router.patch('/:id/cancel', authorize('customer'), cancelRequest);

module.exports = router;
