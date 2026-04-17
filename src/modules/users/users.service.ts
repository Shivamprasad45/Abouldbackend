import prisma from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { Role } from '@prisma/client';

export const usersService = {
  async listUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true, name: true, email: true, role: true,
          avatarUrl: true, isActive: true, createdAt: true,
          _count: { select: { tasksAssigned: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    return { users, total };
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true,
        avatarUrl: true, isActive: true, createdAt: true,
        _count: { select: { tasksAssigned: true, tasksCreated: true } },
      },
    });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return user;
  },

  async updateUserRole(id: string, role: Role) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
  },

  async deactivateUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, email: true, isActive: true },
    });
  },
};
