const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  expectedPrice: {
    type: Number,
    required: [true, 'Expected price is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  preferredDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'completed', 'cancelled'],
    default: 'open'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
