import { Response, NextFunction } from 'express';
import { tasksService } from './tasks.service';
import { sendSuccess, paginate } from '../../utils/response';
import { AuthRequest } from '../../types';
import { TaskStatus } from '@prisma/client';

const param = (v: string | string[]): string => (Array.isArray(v) ? v[0]! : v);

export const tasksController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.createTask(req.body, req.user!.userId);
      sendSuccess(res, task, 'Task created', 201);
    } catch (err) { next(err); }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = req.parsedQuery as never;
      const { tasks, total } = await tasksService.getTasks(
        filters,
        req.user!.userId,
        req.user!.role
      );
      const page = Number((req.parsedQuery?.['page'])) || 1;
      const limit = Number((req.parsedQuery?.['limit'])) || 20;
      sendSuccess(res, tasks, 'Tasks retrieved', 200, paginate(total, page, limit));
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.getTaskById(
        param(req.params['id']!), req.user!.userId, req.user!.role
      );
      sendSuccess(res, task, 'Task retrieved');
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.updateTask(
        param(req.params['id']!), req.body, req.user!.userId, req.user!.role
      );
      sendSuccess(res, task, 'Task updated');
    } catch (err) { next(err); }
  },

  async changeStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.changeStatus(
        param(req.params['id']!), req.body.status as TaskStatus,
        req.user!.userId, req.user!.role
      );
      sendSuccess(res, task, 'Task status updated');
    } catch (err) { next(err); }
  },

  async assign(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.assignTask(
        param(req.params['id']!), req.body.assigneeId, req.user!.userId
      );
      sendSuccess(res, task, 'Task assigned');
    } catch (err) { next(err); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await tasksService.deleteTask(param(req.params['id']!), req.user!.userId, req.user!.role);
      sendSuccess(res, null, 'Task deleted');
    } catch (err) { next(err); }
  },

  async reorder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await tasksService.reorderTasks(req.body.tasks, req.user!.userId);
      sendSuccess(res, null, 'Tasks reordered');
    } catch (err) { next(err); }
  },

  async dashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await tasksService.getDashboardStats(req.user!.role, req.user!.userId);
      sendSuccess(res, stats, 'Dashboard stats');
    } catch (err) { next(err); }
  },
};
