const ServiceRequest = require('../models/ServiceRequest');
const Service = require('../models/Service');

// @desc    Create a service request
// @route   POST /api/requests
// @access  Private/Customer
exports.createRequest = async (req, res) => {
  try {
    const { serviceId, description, expectedPrice, location, preferredDate } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const request = await ServiceRequest.create({
      customerId: req.user._id,
      serviceId,
      serviceType: service.title,
      description,
      expectedPrice,
      location,
      preferredDate
    });

    return res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error(`Error in createRequest:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// @desc    Get all open requests
// @route   GET /api/requests
// @access  Private/Provider/Admin
exports.getOpenRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ status: 'open' })
      .populate('customerId', 'name avatar')
      .populate('serviceId', 'title');

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error(`Error in getOpenRequests:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// @desc    Get my requests (customer view)
// @route   GET /api/requests/my
// @access  Private/Customer
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ customerId: req.user._id })
      .populate('serviceId', 'title')
      .sort('-createdAt');

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error(`Error in getMyRequests:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// @desc    Get single request
// @route   GET /api/requests/:id
// @access  Private
exports.getRequestById = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customerId', 'name avatar phone')
      .populate('serviceId', 'title description');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    return res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error(`Error in getRequestById:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// @desc    Cancel request
// @route   PATCH /api/requests/:id/cancel
// @access  Private/Customer
exports.cancelRequest = async (req, res) => {
  try {
    let request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Check ownership
    if (request.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this request' });
    }

    if (request.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a request that is already assigned or completed' });
    }

    request.status = 'cancelled';
    await request.save();

    return res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error(`Error in cancelRequest:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};
