import { Router } from 'express';
import { activityController } from './activity.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Activity
 *   description: Activity log feed
 */

/**
 * @swagger
 * /activity:
 *   get:
 *     summary: Get activity feed with pagination
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: taskId
 *         schema: { type: string }
 *         description: Filter by task ID
 */
router.get('/', authenticate, activityController.list);

export default router;
