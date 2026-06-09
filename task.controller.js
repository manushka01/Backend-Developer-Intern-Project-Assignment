const Task = require('../models/Task');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Build filter from query params
 */
const buildFilter = (query, userId, isAdmin) => {
  const filter = {};

  // Non-admins see only their tasks
  if (!isAdmin) filter.createdBy = userId;

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.archived !== undefined) filter.isArchived = query.archived === 'true';
  else filter.isArchived = false;

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

/**
 * GET /api/v1/tasks
 */
exports.getTasks = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const filter = buildFilter(req.query, req.user._id, req.user.role === 'admin');

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter),
    ]);

    sendSuccess(res, 200, 'Tasks fetched', tasks, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tasks/:id
 */
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!task) return sendError(res, 404, 'Task not found');

    // Non-admins can only see their own tasks
    if (req.user.role !== 'admin' && task.createdBy._id.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Not authorized to view this task');
    }

    sendSuccess(res, 200, 'Task fetched', task);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/tasks
 */
exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate('createdBy', 'name email');
    sendSuccess(res, 201, 'Task created successfully', task);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/tasks/:id
 */
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return sendError(res, 404, 'Task not found');

    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Not authorized to update this task');
    }

    // Prevent changing ownership
    delete req.body.createdBy;

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email').populate('assignedTo', 'name email');

    sendSuccess(res, 200, 'Task updated', task);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/tasks/:id
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return sendError(res, 404, 'Task not found');

    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Not authorized to delete this task');
    }

    await task.deleteOne();
    sendSuccess(res, 200, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/tasks/:id/archive (Admin only)
 */
exports.archiveTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );
    if (!task) return sendError(res, 404, 'Task not found');
    sendSuccess(res, 200, 'Task archived', task);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tasks/stats (Admin only)
 */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        },
      },
    ]);

    const totalTasks = await Task.countDocuments();
    sendSuccess(res, 200, 'Task statistics', { stats, totalTasks });
  } catch (error) {
    next(error);
  }
};
