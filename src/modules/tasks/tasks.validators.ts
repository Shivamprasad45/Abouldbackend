import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional().default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  dueDate: z.iso.datetime().optional().nullable(),
  assigneeId: z.uuid().optional().nullable(),
  projectId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.iso.datetime().optional().nullable(),
  assigneeId: z.uuid().optional().nullable(),
  projectId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
});

export const assignTaskSchema = z.object({
  assigneeId: z.uuid().nullable(),
});

export const reorderTasksSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.uuid(),
      position: z.number(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
    })
  ),
});

export const taskFiltersSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(500).optional().default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'position']).optional().default('position'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;
