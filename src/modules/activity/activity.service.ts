import prisma from '../../config/database';
import { ActivityAction, EntityType, Prisma } from '@prisma/client';

export const activityService = {
  async log(params: {
    actorId: string;
    action: ActivityAction;
    entityType: EntityType;
    entityId: string;
    taskId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return prisma.activityLog.create({ data: params });
  },

  async getActivityFeed(page: number, limit: number, taskId?: string) {
    const where = taskId ? { taskId } : {};
    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, name: true, email: true, avatarUrl: true } },
          task: { select: { id: true, title: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);
    return { activities, total };
  },
};
