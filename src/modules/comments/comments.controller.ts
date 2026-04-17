import { Response, NextFunction } from 'express';
import { commentsService } from './comments.service';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../types';

const param = (v: string | string[]): string => (Array.isArray(v) ? v[0]! : v);

export const commentsController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const comment = await commentsService.createComment(
        param(req.params['taskId']!), req.body.body, req.user!.userId
      );
      sendSuccess(res, comment, 'Comment added', 201);
    } catch (err) { next(err); }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const comments = await commentsService.getComments(param(req.params['taskId']!));
      sendSuccess(res, comments, 'Comments retrieved');
    } catch (err) { next(err); }
  },

  async edit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const comment = await commentsService.editComment(
        param(req.params['id']!), req.body.body, req.user!.userId
      );
      sendSuccess(res, comment, 'Comment updated');
    } catch (err) { next(err); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await commentsService.deleteComment(
        param(req.params['id']!), req.user!.userId, req.user!.role
      );
      sendSuccess(res, null, 'Comment deleted');
    } catch (err) { next(err); }
  },
};
