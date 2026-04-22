const Review = require('../models/Review');
const Bid = require('../models/Bid');
const ProviderProfile = require('../models/ProviderProfile');
const Service = require('../models/Service');
const mongoose = require('mongoose');

// Helper to update ratings
const updateRatings = async (toUserId, serviceId) => {
  // Update Provider Profile Rating
  const providerStats = await Review.aggregate([
    { $match: { toUserId: new mongoose.Types.ObjectId(toUserId), type: 'customer_to_provider' } },
    { $group: { _id: '$toUserId', avgRating: { $avg: '$rating' } } }
  ]);

  if (providerStats.length > 0) {
    await ProviderProfile.findOneAndUpdate(
      { user: toUserId },
      { avgRating: providerStats[0].avgRating.toFixed(1) }
    );
  }

  // Update Service Rating
  if (serviceId) {
    const serviceStats = await Review.aggregate([
      // We need to match reviews associated with this service
      // Since reviews are linked to Bids, and Bids to Requests, and Requests to Services
      // This is slightly complex. For simplicity, we can fetch all review ratings 
      // for jobs related to this specific service.
      {
        $lookup: {
          from: 'bids',
          localField: 'bidId',
          foreignField: '_id',
          as: 'bid'
        }
      },
      { $unwind: '$bid' },
      {
        $lookup: {
          from: 'servicerequests',
          localField: 'bid.requestId',
          foreignField: '_id',
          as: 'request'
        }
      },
      { $unwind: '$request' },
      { $match: { 'request.serviceId': new mongoose.Types.ObjectId(serviceId), type: 'customer_to_provider' } },
      { $group: { _id: '$request.serviceId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (serviceStats.length > 0) {
      await Service.findByIdAndUpdate(serviceId, {
        avgRating: serviceStats[0].avgRating.toFixed(1),
        reviewCount: serviceStats[0].count
      });
    }
  }
};

// @desc    Submit a review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { bidId, rating, comment, type } = req.body;

    const bid = await Bid.findById(bidId).populate('requestId');
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

    const review = await Review.create({ bidId, fromUserId: req.user._id, toUserId: bid.customerId, rating, comment, type });
    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error(`Error in createReview:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ toUserId: req.params.userId }).populate('fromUserId', 'name avatar');
    return res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error(`Error in getUserReviews:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Get reviews for a service
// @route   GET /api/reviews/service/:serviceId
// @access  Public
exports.getServiceReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ serviceId: req.params.serviceId }).populate('fromUserId', 'name avatar');
    return res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error(`Error in getServiceReviews:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// @desc    Get review for a bid
// @route   GET /api/reviews/bid/:bidId
// @access  Private
exports.getBidReview = async (req, res) => {
  try {
    const review = await Review.findOne({ bidId: req.params.bidId }).populate('fromUserId').populate('toUserId');
    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error(`Error in getBidReview:`, error.message);
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
  }
};
