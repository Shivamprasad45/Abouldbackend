import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from './errorHandler';
import { AuthRequest } from '../types';

export const requireRole = (roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required roles: ${roles.join(', ')}`,
          403,
          'FORBIDDEN'
        )
      );
    }
    next();
  };
};
