const User = require('../models/User');
const Task = require('../models/Task');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * GET /api/v1/users  (Admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Users fetched', users, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/:id  (Admin only)
 */
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    sendSuccess(res, 200, 'User fetched', user);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/:id/role  (Admin only)
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return sendError(res, 400, 'Role must be user or admin');
    }

    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 400, 'Admins cannot change their own role');
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return sendError(res, 404, 'User not found');

    sendSuccess(res, 200, 'User role updated', user);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/:id/deactivate  (Admin only)
 */
exports.deactivateUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 400, 'Cannot deactivate your own account');
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false, refreshToken: null },
      { new: true }
    );
    if (!user) return sendError(res, 404, 'User not found');

    sendSuccess(res, 200, 'User deactivated', user);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/users/profile  (Own profile update)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Whitelist fields user can update
    const allowed = ['name'];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key]) updates[key] = req.body[key]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    sendSuccess(res, 200, 'Profile updated', user);
  } catch (error) {
    next(error);
  }
};
