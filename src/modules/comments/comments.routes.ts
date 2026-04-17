import { Router } from 'express';
import { commentsController } from './comments.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { z } from 'zod';

const router = Router({ mergeParams: true });

const commentBodySchema = z.object({ body: z.string().min(1).max(2000) });

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Task comments
 */

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   get:
 *     summary: Get comments for a task
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, commentsController.list);
router.post('/', authenticate, validate(commentBodySchema), commentsController.create);

/**
 * @swagger
 * /tasks/{taskId}/comments/{id}:
 *   patch:
 *     summary: Edit a comment (within 15 min)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Soft-delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', authenticate, validate(commentBodySchema), commentsController.edit);
router.delete('/:id', authenticate, commentsController.delete);

export default router;
