import { Router } from 'express';
import { tasksController } from './tasks.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import {
  createTaskSchema, updateTaskSchema, changeStatusSchema,
  assignTaskSchema, reorderTasksSchema, taskFiltersSchema,
} from './tasks.validators';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List tasks with filters
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *       - in: query
 *         name: assigneeId
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get('/', authenticate, validate(taskFiltersSchema, 'query'), tasksController.list);

/**
 * @swagger
 * /tasks/dashboard:
 *   get:
 *     summary: Dashboard statistics
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', authenticate, requireRole(['ADMIN', 'MANAGER']), tasksController.dashboard);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, requireRole(['ADMIN', 'MANAGER']), validate(createTaskSchema), tasksController.create);

/**
 * @swagger
 * /tasks/reorder:
 *   patch:
 *     summary: Reorder tasks (Kanban drag-and-drop)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/reorder', authenticate, validate(reorderTasksSchema), tasksController.reorder);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, tasksController.getById);

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', authenticate, validate(updateTaskSchema), tasksController.update);

/**
 * @swagger
 * /tasks/{id}/status:
 *   patch:
 *     summary: Change task status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/status', authenticate, validate(changeStatusSchema), tasksController.changeStatus);

/**
 * @swagger
 * /tasks/{id}/assign:
 *   patch:
 *     summary: Assign task to user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/assign', authenticate, requireRole(['ADMIN', 'MANAGER']), validate(assignTaskSchema), tasksController.assign);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, requireRole(['ADMIN', 'MANAGER']), tasksController.delete);

export default router;
