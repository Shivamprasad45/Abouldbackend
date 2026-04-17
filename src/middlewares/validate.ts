import { Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { AppError } from './errorHandler';
import { AuthRequest } from '../types';

type ValidateTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodType, target: ValidateTarget = 'body') =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.issues.forEach((e) => {
        const field = e.path.join('.') || 'root';
        if (!errors[field]) errors[field] = [];
        errors[field].push(e.message);
      });
      return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors));
    }
    // Express 5 makes req.query read-only — store coerced query data on parsedQuery
    if (target === 'query') {
      req.parsedQuery = result.data as Record<string, unknown>;
    } else {
      req[target] = result.data;
    }
    next();
  };
