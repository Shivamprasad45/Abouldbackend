import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta
): void => {
  const response: ApiResponse<T> = { success: true, message, data, meta };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  code?: string
): void => {
  const response: ApiResponse = { success: false, message };
  if (code) Object.assign(response, { code });
  res.status(statusCode).json(response);
};

export const paginate = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
