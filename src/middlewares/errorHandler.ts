import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../config/logger';
import { ApiResponse } from '../types';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  // Known operational error
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      message: err.message,
      errors: err.errors,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Zod validation error
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.issues.forEach((e) => {
      const field = e.path.join('.');
      if (!errors[field]) errors[field] = [];
      errors[field].push(e.message);
    });
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    } satisfies ApiResponse);
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'A record with this value already exists',
        code: 'CONFLICT',
      } satisfies ApiResponse);
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found',
        code: 'NOT_FOUND',
      } satisfies ApiResponse);
      return;
    }
  }

  // Default 500
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  } satisfies ApiResponse);
};
