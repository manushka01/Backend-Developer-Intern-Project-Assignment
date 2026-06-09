const router = require('express').Router();
const {
  getAllUsers, getUser, updateUserRole, deactivateUser, updateProfile,
} = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { objectIdValidator } = require('../middleware/validators');

router.use(protect);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update own profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', updateProfile);

// ── Admin-only routes ────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, admin] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User list
 *       403:
 *         description: Admin access required
 */
router.get('/', restrictTo('admin'), getAllUsers);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/:id', restrictTo('admin'), objectIdValidator(), getUser);

/**
 * @swagger
 * /api/v1/users/{id}/role:
 *   patch:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch('/:id/role', restrictTo('admin'), objectIdValidator(), updateUserRole);

/**
 * @swagger
 * /api/v1/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deactivated
 */
router.patch('/:id/deactivate', restrictTo('admin'), objectIdValidator(), deactivateUser);

module.exports = router;
