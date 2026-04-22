const Bid = require('../models/Bid');
const ServiceRequest = require('../models/ServiceRequest');
const ProviderProfile = require('../models/ProviderProfile');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Submit a bid on a request
// @route   POST /api/bids
// @access  Private/Provider
exports.submitBid = async (req, res) => {
  try {
    const { requestId, offerPrice, message } = req.body;

    const request = await ServiceRequest.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const providerProfile = await ProviderProfile.findOne({ user: req.user._id });
    if (!providerProfile || !providerProfile.isApproved) {
      return res.status(403).json({ success: false, message: 'Provider profile not approved or found' });
    }

    const bid = await Bid.create({ requestId, providerId: providerProfile._id, customerId: request.customerId, offerPrice, message });

    return res.status(201).json({ success: true, data: bid });
  } catch (error) {
    console.error(`Error in submitBid:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Get all bids for a request
// @route   GET /api/bids/request/:requestId
// @access  Private
exports.getRequestBids = async (req, res) => {
  try {
    const bids = await Bid.find({ requestId: req.params.requestId }).populate({ path: 'providerId', populate: { path: 'user' } });
    return res.status(200).json({ success: true, data: bids });
  } catch (error) {
    console.error(`Error in getRequestBids:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Get my bids (provider view)
// @route   GET /api/bids/my
// @access  Private/Provider
exports.getMyBids = async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({ user: req.user._id });
    const bids = await Bid.find({ providerId: profile?._id }).populate('requestId');
    return res.status(200).json({ success: true, data: bids });
  } catch (error) {
    console.error(`Error in getMyBids:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Accept a bid
// @route   PATCH /api/bids/:id/accept
// @access  Private/Customer
exports.acceptBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ success: false, message: "Not found" });

    bid.status = 'accepted';
    await bid.save();
    await ServiceRequest.findByIdAndUpdate(bid.requestId, { status: 'assigned' });
    await Bid.updateMany({ requestId: bid.requestId, _id: { $ne: bid._id } }, { status: 'rejected' });

    return res.status(200).json({ success: true, message: "Accepted" });
  } catch (error) {
    console.error(`Error in acceptBid:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Reject a bid
// @route   PATCH /api/bids/:id/reject
// @access  Private/Customer
exports.rejectBid = async (req, res) => {
  try {
    await Bid.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    return res.status(200).json({ success: true, message: "Rejected" });
  } catch (error) {
    console.error(`Error in rejectBid:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Mark job as completed
// @route   PATCH /api/bids/:id/complete
// @access  Private/Provider
exports.completeJob = async (req, res) => {
  try {
    const bid = await Bid.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true });
    await ServiceRequest.findByIdAndUpdate(bid.requestId, { status: 'completed' });
    return res.status(200).json({ success: true, message: "Completed" });
  } catch (error) {
    console.error(`Error in completeJob:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};
