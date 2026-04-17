import { Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess, paginate } from '../../utils/response';
import { AuthRequest } from '../../types';

const param = (v: string | string[]): string => (Array.isArray(v) ? v[0]! : v);

export const usersController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query['page']) || 1;
      const limit = Number(req.query['limit']) || 20;
      const { users, total } = await usersService.listUsers(page, limit);
      sendSuccess(res, users, 'Users retrieved', 200, paginate(total, page, limit));
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getUserById(param(req.params['id']!));
      sendSuccess(res, user, 'User retrieved');
    } catch (err) { next(err); }
  },

  async updateRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateUserRole(param(req.params['id']!), req.body.role);
      sendSuccess(res, user, 'User role updated');
    } catch (err) { next(err); }
  },

  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.deactivateUser(param(req.params['id']!));
      sendSuccess(res, user, 'User deactivated');
    } catch (err) { next(err); }
  },
};
