const Service         = require("../models/Service");
const ServiceCategory = require("../models/ServiceCategory");

// ════════════════════════════════════════════════════════════════════════════
//  CATEGORY ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// ─── @desc    List all active categories
// ─── @route   GET /api/services/categories
// ─── @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find({ isActive: true }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: categories.map((c) => ({
        categoryId:  c._id,
        name:        c.name,
        description: c.description,
        icon:        c.icon || null,
        isActive:    c.isActive,
      })),
    });
  } catch (error) {
    console.error(`Error in getCategories:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Create a new category
// ─── @route   POST /api/services/categories
// ─── @access  Admin only
const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Name and description are required" },
      });
    }

    const existing = await ServiceCategory.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: "CATEGORY_EXISTS", message: "A category with this name already exists" },
      });
    }

    const category = await ServiceCategory.create({
      name:        name.trim(),
      description: description.trim(),
      icon:        icon ? icon.trim() : null,
    });

    return res.status(201).json({ success: true, message: "Category created", data: category });
  } catch (error) {
    console.error(`Error in createCategory:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ════════════════════════════════════════════════════════════════════════════
//  SERVICE LISTING ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// ─── @desc    Browse / search all active services with filters & pagination
// ─── @route   GET /api/services
// ─── @access  Public
const getServices = async (req, res) => {
  try {
    const {
      category,
      city,
      minPrice,
      maxPrice,
      rating,
      page     = 1,
      limit    = 20,
      sortBy,         
    } = req.query;

    const filter = { isActive: true };

    if (category) {
      const cat = await ServiceCategory.findOne({ name: { $regex: new RegExp(category, "i") }, isActive: true });
      if (cat) filter.category = cat._id;
      else filter.category = null; 
    }

    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    if (rating) filter.avgRating = { $gte: Number(rating) };

    let sort = {};
    if (sortBy === "price")   sort = { basePrice: 1 };
    else if (sortBy === "rating") sort = { avgRating: -1 };
    else sort = { createdAt: -1 };   

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      Service.find(filter).sort(sort).skip(skip).limit(limitNum).populate("category", "name").populate("provider", "name avatar city"),
      Service.countDocuments(filter),
    ]);

    let filtered = services;
    if (city) {
      filtered = services.filter((s) => s.provider?.city?.toLowerCase() === city.toLowerCase());
    }

    return res.status(200).json({ success: true, pagination: { page: pageNum, limit: limitNum, total }, data: filtered });
  } catch (error) {
    console.error(`Error in getServices:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Create a new service listing
// ─── @route   POST /api/services
// ─── @access  Provider only
const createService = async (req, res) => {
  try {
    const { title, description, categoryId, basePrice, pricingType, images } = req.body;

    const service = await Service.create({
      title, description, category: categoryId, provider: req.user._id, basePrice, pricingType, images: images || []
    });

    return res.status(201).json({ success: true, message: "Service created", data: service });
  } catch (error) {
    console.error(`Error in createService:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Get a single service by ID
// ─── @route   GET /api/services/:serviceId
// ─── @access  Public
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId).populate("category").populate("provider");
    if (!service) return res.status(404).json({ success: false, message: "Not found" });

    return res.status(200).json({ success: true, data: service });
  } catch (error) {
    console.error(`Error in getServiceById:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Update a service listing (partial)
// ─── @route   PATCH /api/services/:serviceId
// ─── @access  Owning Provider or Admin
const updateService = async (req, res) => {
  try {
    const updated = await Service.findByIdAndUpdate(req.params.serviceId, { $set: req.body }, { new: true });
    return res.status(200).json({ success: true, message: "Updated", data: updated });
  } catch (error) {
    console.error(`Error in updateService:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// ─── @desc    Soft-delete a service listing
// ─── @route   DELETE /api/services/:serviceId
// ─── @access  Owning Provider or Admin
const deleteService = async (req, res) => {
  try {
    await Service.findByIdAndUpdate(req.params.serviceId, { $set: { isActive: false } });
    return res.status(200).json({ success: true, message: "Removed" });
  } catch (error) {
    console.error(`Error in deleteService:`, error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  getServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
};