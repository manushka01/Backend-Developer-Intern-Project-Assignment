const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 401, 'Access denied. No token provided.');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check user still exists and is active
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      return sendError(res, 401, 'User belonging to this token no longer exists.');
    }

    if (!user.isActive) {
      return sendError(res, 401, 'Your account has been deactivated. Contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid token. Please log in again.');
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expired. Please log in again.');
    }
    next(error);
  }
};

/**
 * Restrict to specific roles
 * Usage: restrictTo('admin') or restrictTo('admin', 'user')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. This action requires role: ${roles.join(' or ')}.`
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
