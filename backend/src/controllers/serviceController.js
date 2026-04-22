const Service         = require("../models/Service");
const ServiceCategory = require("../models/ServiceCategory");

// ════════════════════════════════════════════════════════════════════════════
//  CATEGORY ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// ─── @desc    List all active categories
// ─── @route   GET /api/services/categories
// ─── @access  Public
const getCategories = async (req, res, next) => {
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
    next(error);
  }
};

// ─── @desc    Create a new category
// ─── @route   POST /api/services/categories
// ─── @access  Admin only
const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Name and description are required" },
      });
    }

    // Check for duplicate category name (case-insensitive)
    const existing = await ServiceCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
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

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: {
        categoryId:  category._id,
        name:        category.name,
        description: category.description,
        icon:        category.icon,
        isActive:    category.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════════════════
//  SERVICE LISTING ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// ─── @desc    Browse / search all active services with filters & pagination
// ─── @route   GET /api/services
// ─── @access  Public
const getServices = async (req, res, next) => {
  try {
    const {
      category,
      city,
      minPrice,
      maxPrice,
      rating,
      page     = 1,
      limit    = 20,
      sortBy,          // price | rating | newest
    } = req.query;

    const filter = { isActive: true };

    // ── Category filter ──
    if (category) {
      const cat = await ServiceCategory.findOne({
        name: { $regex: new RegExp(category, "i") },
        isActive: true,
      });
      if (cat) filter.category = cat._id;
      else filter.category = null; // no match → returns empty
    }

    // ── Price range filter ──
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    // ── Rating filter ──
    if (rating) {
      filter.avgRating = { $gte: Number(rating) };
    }

    // ── Sorting ──
    let sort = {};
    if (sortBy === "price")   sort = { basePrice: 1 };
    else if (sortBy === "rating") sort = { avgRating: -1 };
    else sort = { createdAt: -1 };   // default: newest

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      Service.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate("category", "name")
        .populate("provider", "name avatar city"),
      Service.countDocuments(filter),
    ]);

    // ── City filter (applied after populate since city lives on User) ──
    let filtered = services;
    if (city) {
      filtered = services.filter(
        (s) => s.provider?.city?.toLowerCase() === city.toLowerCase()
      );
    }

    return res.status(200).json({
      success: true,
      pagination: {
        page:  pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      data: filtered.map((s) => ({
        serviceId:   s._id,
        title:       s.title,
        description: s.description,
        category:    s.category?.name || null,
        basePrice:   s.basePrice,
        pricingType: s.pricingType,
        avgRating:   s.avgRating,
        reviewCount: s.reviewCount,
        provider: {
          providerId: s.provider?._id   || null,
          name:       s.provider?.name  || null,
          avatar:     s.provider?.avatar || null,
          city:       s.provider?.city  || null,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Create a new service listing
// ─── @route   POST /api/services
// ─── @access  Provider only
const createService = async (req, res, next) => {
  try {
    const { title, description, categoryId, basePrice, pricingType, images } = req.body;

    // ── Required field validation ──
    if (!title || !description || !categoryId || !basePrice || !pricingType) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "title, description, categoryId, basePrice, and pricingType are all required",
        },
      });
    }

    if (!["fixed", "hourly", "quote"].includes(pricingType)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "pricingType must be fixed, hourly, or quote" },
      });
    }

    if (Number(basePrice) <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "basePrice must be greater than 0" },
      });
    }

    if (images && images.length > 5) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Maximum 5 images allowed" },
      });
    }

    // ── Verify category exists ──
    const category = await ServiceCategory.findById(categoryId);
    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        error: { code: "CATEGORY_NOT_FOUND", message: "The provided category does not exist" },
      });
    }

    const service = await Service.create({
      title:       title.trim(),
      description: description.trim(),
      category:    categoryId,
      provider:    req.user._id,
      basePrice:   Number(basePrice),
      pricingType,
      images:      images || [],
    });

    await service.populate("category", "name");

    return res.status(201).json({
      success: true,
      message: "Service listing created successfully",
      data: {
        serviceId:   service._id,
        title:       service.title,
        description: service.description,
        category:    service.category?.name,
        basePrice:   service.basePrice,
        pricingType: service.pricingType,
        images:      service.images,
        avgRating:   service.avgRating,
        reviewCount: service.reviewCount,
        createdAt:   service.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Get a single service by ID
// ─── @route   GET /api/services/:serviceId
// ─── @access  Public
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.serviceId)
      .populate("category", "name description icon")
      .populate("provider",  "name avatar city phone");

    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        error: { code: "SERVICE_NOT_FOUND", message: "No service found with this ID" },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        serviceId:   service._id,
        title:       service.title,
        description: service.description,
        category: {
          categoryId:  service.category?._id,
          name:        service.category?.name,
          description: service.category?.description,
          icon:        service.category?.icon,
        },
        basePrice:   service.basePrice,
        pricingType: service.pricingType,
        images:      service.images,
        avgRating:   service.avgRating,
        reviewCount: service.reviewCount,
        provider: {
          providerId: service.provider?._id,
          name:       service.provider?.name,
          avatar:     service.provider?.avatar,
          city:       service.provider?.city,
          phone:      service.provider?.phone,
        },
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Update a service listing (partial)
// ─── @route   PATCH /api/services/:serviceId
// ─── @access  Owning Provider or Admin
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.serviceId);

    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        error: { code: "SERVICE_NOT_FOUND", message: "No service found with this ID" },
      });
    }

    // ── Ownership check ──
    const isOwner = service.provider.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You can only update your own service listings" },
      });
    }

    const { title, description, categoryId, basePrice, pricingType, images } = req.body;
    const updates = {};

    if (title !== undefined) {
      const t = title.trim();
      if (t.length < 5 || t.length > 100) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Title must be between 5 and 100 characters" },
        });
      }
      updates.title = t;
    }

    if (description !== undefined) {
      const d = description.trim();
      if (d.length < 20 || d.length > 1000) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Description must be between 20 and 1000 characters" },
        });
      }
      updates.description = d;
    }

    if (categoryId !== undefined) {
      const cat = await ServiceCategory.findById(categoryId);
      if (!cat || !cat.isActive) {
        return res.status(404).json({
          success: false,
          error: { code: "CATEGORY_NOT_FOUND", message: "The provided category does not exist" },
        });
      }
      updates.category = categoryId;
    }

    if (basePrice !== undefined) {
      if (Number(basePrice) <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "basePrice must be greater than 0" },
        });
      }
      updates.basePrice = Number(basePrice);
    }

    if (pricingType !== undefined) {
      if (!["fixed", "hourly", "quote"].includes(pricingType)) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "pricingType must be fixed, hourly, or quote" },
        });
      }
      updates.pricingType = pricingType;
    }

    if (images !== undefined) {
      if (images.length > 5) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Maximum 5 images allowed" },
        });
      }
      updates.images = images;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "No valid fields provided to update" },
      });
    }

    const updated = await Service.findByIdAndUpdate(
      req.params.serviceId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("category", "name");

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: {
        serviceId:   updated._id,
        title:       updated.title,
        description: updated.description,
        category:    updated.category?.name,
        basePrice:   updated.basePrice,
        pricingType: updated.pricingType,
        images:      updated.images,
        avgRating:   updated.avgRating,
        reviewCount: updated.reviewCount,
        updatedAt:   updated.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Soft-delete a service listing
// ─── @route   DELETE /api/services/:serviceId
// ─── @access  Owning Provider or Admin
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.serviceId);

    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        error: { code: "SERVICE_NOT_FOUND", message: "No service found with this ID" },
      });
    }

    // ── Ownership check ──
    const isOwner = service.provider.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You can only delete your own service listings" },
      });
    }

    // TODO: Uncomment when Booking model is ready
    // const Booking = require("../models/Booking");
    // const activeBooking = await Booking.findOne({
    //   service: service._id,
    //   status: { $in: ["pending", "confirmed", "in_progress"] },
    // });
    // if (activeBooking) {
    //   return res.status(409).json({
    //     success: false,
    //     error: {
    //       code: "ACTIVE_BOOKINGS",
    //       message: "This service has active bookings. Resolve them before deleting.",
    //     },
    //   });
    // }

    // Soft delete — keeps historical booking records intact
    await Service.findByIdAndUpdate(req.params.serviceId, { $set: { isActive: false } });

    return res.status(200).json({
      success: true,
      message: "Service listing removed successfully",
    });
  } catch (error) {
    next(error);
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