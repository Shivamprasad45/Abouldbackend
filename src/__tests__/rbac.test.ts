import { Response, NextFunction } from 'express';
import { requireRole } from '../middlewares/rbac';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../types';

// Minimal mock helpers
const mockRes = {} as Response;
const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

const makeReq = (role?: string): AuthRequest => ({
  user: role ? { userId: 'u1', email: 'a@b.com', role: role as never } : undefined,
} as AuthRequest);

beforeEach(() => mockNext.mockClear());

describe('requireRole middleware', () => {
  test('passes when user has a required role', () => {
    const middleware = requireRole(['ADMIN', 'MANAGER']);
    middleware(makeReq('ADMIN'), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(); // called with no args = success
  });

  test('calls next with 403 AppError when role is not allowed', () => {
    const middleware = requireRole(['ADMIN']);
    middleware(makeReq('USER'), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    const err = mockNext.mock.calls[0]![0] as unknown as AppError;
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  test('calls next with 401 when user is not authenticated', () => {
    const middleware = requireRole(['ADMIN']);
    middleware(makeReq(), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    const err = mockNext.mock.calls[0]![0] as unknown as AppError;
    expect(err.statusCode).toBe(401);
  });

  test('MANAGER can access MANAGER routes', () => {
    const middleware = requireRole(['ADMIN', 'MANAGER']);
    middleware(makeReq('MANAGER'), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  test('USER cannot access ADMIN-only routes', () => {
    const middleware = requireRole(['ADMIN']);
    middleware(makeReq('USER'), mockRes, mockNext);
    const err = mockNext.mock.calls[0]![0] as unknown as AppError;
    expect(err.statusCode).toBe(403);
  });
});
