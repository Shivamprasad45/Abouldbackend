import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { z } from 'zod';

const router = Router();

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'USER']),
});

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (Admin only)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', authenticate, requireRole(['ADMIN', 'MANAGER']), usersController.list);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
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
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticate, requireRole(['ADMIN', 'MANAGER']), usersController.getById);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/role',
  authenticate,
  requireRole(['ADMIN']),
  validate(updateRoleSchema),
  usersController.updateRole
);

/**
 * @swagger
 * /users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/deactivate',
  authenticate,
  requireRole(['ADMIN']),
  usersController.deactivate
);

export default router;
