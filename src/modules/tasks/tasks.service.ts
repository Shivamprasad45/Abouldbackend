import prisma from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { activityService } from '../activity/activity.service';
import { CreateTaskInput, UpdateTaskInput, TaskFiltersInput } from './tasks.validators';
import { TaskStatus, TaskPriority, Prisma } from '@prisma/client';

const TASK_SELECT = {
  id: true, title: true, description: true, status: true, priority: true,
  dueDate: true, tags: true, position: true, projectId: true, createdAt: true, updatedAt: true,
  assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { comments: true } },
} as const;

export const tasksService = {
  async createTask(input: CreateTaskInput, userId: string) {
    // Calculate max position for the status column
    const maxPositionTask = await prisma.task.findFirst({
      where: { status: input.status as TaskStatus },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const position = (maxPositionTask?.position ?? 0) + 1000;

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        status: input.status as TaskStatus,
        priority: input.priority as TaskPriority,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        assigneeId: input.assigneeId ?? null,
        projectId: input.projectId ?? null,
        tags: input.tags ?? [],
        position,
        createdById: userId,
      },
      select: TASK_SELECT,
    });

    await activityService.log({
      actorId: userId,
      action: 'CREATED',
      entityType: 'TASK',
      entityId: task.id,
      taskId: task.id,
      metadata: { title: task.title },
    });

    return task;
  },

  async getTasks(filters: TaskFiltersInput, userId: string, userRole: string) {
    const { status, priority, assigneeId, search, page, limit, sortBy, sortOrder } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {};

    // RBAC: regular users only see their own tasks
    if (userRole === 'USER') where.assigneeId = userId;
    if (status) where.status = status as TaskStatus;
    if (priority) where.priority = priority as TaskPriority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: TASK_SELECT,
      }),
      prisma.task.count({ where }),
    ]);

    return { tasks, total };
  },

  async getTaskById(id: string, userId: string, userRole: string) {
    const task = await prisma.task.findUnique({ where: { id }, select: TASK_SELECT });
    if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');
    if (userRole === 'USER' && task.assignee?.id !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
    return task;
  },

  async updateTask(id: string, input: UpdateTaskInput, userId: string, userRole: string) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new AppError('Task not found', 404, 'NOT_FOUND');
    if (userRole === 'USER' && existing.assigneeId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...input,
        dueDate: input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : null) : undefined,
      },
      select: TASK_SELECT,
    });

    await activityService.log({
      actorId: userId,
      action: 'UPDATED',
      entityType: 'TASK',
      entityId: id,
      taskId: id,
      metadata: { changes: input },
    });

    return task;
  },

  async changeStatus(id: string, status: TaskStatus, userId: string, userRole: string) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new AppError('Task not found', 404, 'NOT_FOUND');
    if (userRole === 'USER' && existing.assigneeId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status },
      select: TASK_SELECT,
    });

    await activityService.log({
      actorId: userId,
      action: 'STATUS_CHANGED',
      entityType: 'TASK',
      entityId: id,
      taskId: id,
      metadata: { from: existing.status, to: status },
    });

    return task;
  },

  async assignTask(id: string, assigneeId: string | null, userId: string) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new AppError('Task not found', 404, 'NOT_FOUND');

    const task = await prisma.task.update({
      where: { id },
      data: { assigneeId },
      select: TASK_SELECT,
    });

    await activityService.log({
      actorId: userId,
      action: 'ASSIGNED',
      entityType: 'TASK',
      entityId: id,
      taskId: id,
      metadata: { assigneeId },
    });

    return task;
  },

  async deleteTask(id: string, userId: string, userRole: string) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new AppError('Task not found', 404, 'NOT_FOUND');
    if (userRole === 'USER') throw new AppError('Access denied', 403, 'FORBIDDEN');

    await prisma.task.delete({ where: { id } });

    await activityService.log({
      actorId: userId,
      action: 'DELETED',
      entityType: 'TASK',
      entityId: id,
      metadata: { title: existing.title },
    });
  },

  async reorderTasks(tasks: Array<{ id: string; position: number; status?: string }>, userId: string) {
    // Bulk update positions using a transaction
    await prisma.$transaction(
      tasks.map(({ id, position, status }) =>
        prisma.task.update({
          where: { id },
          data: { position, ...(status ? { status: status as TaskStatus } : {}) },
        })
      )
    );

    await activityService.log({
      actorId: userId,
      action: 'UPDATED',
      entityType: 'TASK',
      entityId: 'bulk',
      metadata: { reordered: tasks.length },
    });
  },

  async getDashboardStats(userRole: string, userId: string) {
    const where = userRole === 'USER' ? { assigneeId: userId } : {};

    const [statusCounts, overdueTasks, tasksByAssignee] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.task.count({
        where: { ...where, dueDate: { lt: new Date() }, status: { not: 'DONE' } },
      }),
      prisma.task.groupBy({
        by: ['assigneeId'],
        where: { assigneeId: { not: null } },
        _count: { assigneeId: true },
      }),
    ]);

    return { statusCounts, overdueTasks, tasksByAssignee };
  },
};
