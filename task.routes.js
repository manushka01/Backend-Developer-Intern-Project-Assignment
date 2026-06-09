const router = require('express').Router();
const {
  getTasks, getTask, createTask, updateTask, deleteTask, archiveTask, getStats,
} = require('../controllers/task.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { createTaskValidator, updateTaskValidator, objectIdValidator } = require('../middleware/validators');

// All task routes require auth
router.use(protect);

/**
 * @swagger
 * /api/v1/tasks/stats:
 *   get:
 *     summary: Get task statistics (Admin only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task stats by status
 *       403:
 *         description: Admin access required
 */
router.get('/stats', restrictTo('admin'), getStats);

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get all tasks (paginated, filterable)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, done] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated task list
 */
router.get('/', getTasks);

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: "Build login page" }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in_progress, done] }
 *               priority: { type: string, enum: [low, medium, high] }
 *               dueDate: { type: string, format: date }
 *               tags: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Task created
 *       422:
 *         description: Validation error
 */
router.post('/', createTaskValidator, createTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task found
 *       404:
 *         description: Task not found
 */
router.get('/:id', objectIdValidator(), getTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
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
 *           schema: { $ref: '#/components/schemas/Task' }
 *     responses:
 *       200:
 *         description: Task updated
 */
router.put('/:id', objectIdValidator(), updateTaskValidator, updateTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 */
router.delete('/:id', objectIdValidator(), deleteTask);

/**
 * @swagger
 * /api/v1/tasks/{id}/archive:
 *   patch:
 *     summary: Archive a task (Admin only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task archived
 */
router.patch('/:id/archive', objectIdValidator(), restrictTo('admin'), archiveTask);

module.exports = router;
