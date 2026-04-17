import prisma from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { activityService } from '../activity/activity.service';

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const commentsService = {
  async createComment(taskId: string, body: string, authorId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');

    const comment = await prisma.comment.create({
      data: { body, taskId, authorId },
      include: { author: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });

    await activityService.log({
      actorId: authorId,
      action: 'COMMENTED',
      entityType: 'COMMENT',
      entityId: comment.id,
      taskId,
      metadata: { commentId: comment.id },
    });

    return comment;
  },

  async getComments(taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');

    return prisma.comment.findMany({
      where: { taskId, deletedAt: null },
      include: { author: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async editComment(id: string, body: string, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.deletedAt) throw new AppError('Comment not found', 404, 'NOT_FOUND');
    if (comment.authorId !== userId) throw new AppError('Cannot edit another user\'s comment', 403, 'FORBIDDEN');

    const ageMs = Date.now() - comment.createdAt.getTime();
    if (ageMs > EDIT_WINDOW_MS) {
      throw new AppError('Edit window (15 min) has expired', 403, 'EDIT_WINDOW_EXPIRED');
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { body, editedAt: new Date() },
      include: { author: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });

    await activityService.log({
      actorId: userId,
      action: 'COMMENT_EDITED',
      entityType: 'COMMENT',
      entityId: id,
      taskId: comment.taskId,
    });

    return updated;
  },

  async deleteComment(id: string, userId: string, userRole: string) {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.deletedAt) throw new AppError('Comment not found', 404, 'NOT_FOUND');
    if (comment.authorId !== userId && userRole === 'USER') {
      throw new AppError('Cannot delete another user\'s comment', 403, 'FORBIDDEN');
    }

    await prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await activityService.log({
      actorId: userId,
      action: 'COMMENT_DELETED',
      entityType: 'COMMENT',
      entityId: id,
      taskId: comment.taskId,
    });
  },
};
