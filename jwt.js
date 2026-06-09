const jwt = require('jsonwebtoken');

/**
 * Generate access + refresh token pair
 */
const generateTokens = (userId, role) => {
  const payload = { id: userId, role };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    issuer: 'taskflow-api',
  });

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
      issuer: 'taskflow-api',
    }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken };
