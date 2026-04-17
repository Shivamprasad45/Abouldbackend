import { Response, NextFunction } from 'express';
import { activityService } from './activity.service';
import { sendSuccess, paginate } from '../../utils/response';
import { AuthRequest } from '../../types';

export const activityController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query['page']) || 1;
      const limit = Number(req.query['limit']) || 20;
      const taskId = req.query['taskId'] as string | undefined;
      const { activities, total } = await activityService.getActivityFeed(page, limit, taskId);
      sendSuccess(res, activities, 'Activity feed', 200, paginate(total, page, limit));
    } catch (err) { next(err); }
  },
};
