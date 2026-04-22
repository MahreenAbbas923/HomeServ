const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    required: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Comment is required']
  },
  type: {
    type: String,
    enum: ['customer_to_provider', 'provider_to_customer'],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
