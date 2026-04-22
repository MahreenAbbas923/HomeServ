const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const ServiceRequest = require('../models/ServiceRequest');
const Bid = require('../models/Bid');
const Review = require('../models/Review');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get pending providers
// @route   GET /api/admin/providers/pending
// @access  Private/Admin
exports.getPendingProviders = async (req, res) => {
  try {
    const providers = await ProviderProfile.find({ isApproved: false }).populate('user', 'name email phone avatar city');
    return res.status(200).json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    console.error(`Error in getPendingProviders:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Get all providers
// @route   GET /api/admin/providers
// @access  Private/Admin
exports.getAllProviders = async (req, res) => {
  try {
    const providers = await ProviderProfile.find().populate('user', 'name email phone avatar city isActive');
    return res.status(200).json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    console.error(`Error in getAllProviders:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Approve provider
// @route   PATCH /api/admin/providers/:id/approve
// @access  Private/Admin
exports.approveProvider = async (req, res) => {
  try {
    const profile = await ProviderProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Not found' });

    profile.isApproved = true;
    await profile.save();

    return res.status(200).json({ success: true, message: 'Provider approved' });
  } catch (error) {
    console.error(`Error in approveProvider:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Reject provider
// @route   PATCH /api/admin/providers/:id/reject
// @access  Private/Admin
exports.rejectProvider = async (req, res) => {
  try {
    const profile = await ProviderProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Not found' });

    profile.isApproved = false;
    await profile.save();

    return res.status(200).json({ success: true, message: 'Processed' });
  } catch (error) {
    console.error(`Error in rejectProvider:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private/Admin
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' });
    return res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    console.error(`Error in getAllCustomers:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Get all service requests
// @route   GET /api/admin/requests
// @access  Private/Admin
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find().populate('customerId', 'name email').sort('-createdAt');
    return res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error(`Error in getAllRequests:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Get all bids
// @route   GET /api/admin/bids
// @access  Private/Admin
exports.getAllBids = async (req, res) => {
  try {
    const bids = await Bid.find().populate({ path: 'providerId', populate: { path: 'user' } }).populate('customerId').sort('-createdAt');
    return res.status(200).json({ success: true, count: bids.length, data: bids });
  } catch (error) {
    console.error(`Error in getAllBids:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Get all reviews
// @route   GET /api/admin/reviews
// @access  Private/Admin
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate('fromUserId').populate('toUserId').sort('-createdAt');
    return res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error(`Error in getAllReviews:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProviders = await ProviderProfile.countDocuments();
    const pendingProviders = await ProviderProfile.countDocuments({ isApproved: false });
    const totalRequests = await ServiceRequest.countDocuments();
    const openRequests = await ServiceRequest.countDocuments({ status: 'open' });
    const completedRequests = await ServiceRequest.countDocuments({ status: 'completed' });
    const totalBids = await Bid.countDocuments();
    
    return res.status(200).json({
      success: true,
      data: { totalCustomers, totalProviders, pendingProviders, totalRequests, openRequests, completedRequests, totalBids }
    });
  } catch (error) {
    console.error(`Error in getStats:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};
