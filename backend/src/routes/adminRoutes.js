const express = require('express');
const router = express.Router();
const {
  getPendingProviders,
  getAllProviders,
  approveProvider,
  rejectProvider,
  getAllCustomers,
  getAllRequests,
  getAllBids,
  getAllReviews,
  getStats
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/providers/pending', getPendingProviders);
router.get('/providers', getAllProviders);
router.patch('/providers/:id/approve', approveProvider);
router.patch('/providers/:id/reject', rejectProvider);
router.get('/customers', getAllCustomers);
router.get('/requests', getAllRequests);
router.get('/bids', getAllBids);
router.get('/reviews', getAllReviews);
router.get('/stats', getStats);

module.exports = router;
