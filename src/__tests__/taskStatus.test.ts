import { z } from 'zod';
import { changeStatusSchema, createTaskSchema } from '../modules/tasks/tasks.validators';

describe('Task status transitions (validation layer)', () => {
  const validStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  const invalidStatuses = ['BLOCKED', 'CANCELLED', 'todo', 'in_progress', ''];

  test.each(validStatuses)('accepts valid status: %s', (status) => {
    const result = changeStatusSchema.safeParse({ status });
    expect(result.success).toBe(true);
  });

  test.each(invalidStatuses)('rejects invalid status: %s', (status) => {
    const result = changeStatusSchema.safeParse({ status });
    expect(result.success).toBe(false);
  });
});

describe('Task creation validation', () => {
  test('creates task with minimal required fields', () => {
    const result = createTaskSchema.safeParse({ title: 'Test task' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('TODO');
      expect(result.data.priority).toBe('MEDIUM');
      expect(result.data.tags).toEqual([]);
    }
  });

  test('rejects empty title', () => {
    const result = createTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  test('rejects title over 200 characters', () => {
    const result = createTaskSchema.safeParse({ title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  test('accepts all valid priorities', () => {
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    priorities.forEach((priority) => {
      const result = createTaskSchema.safeParse({ title: 'Task', priority });
      expect(result.success).toBe(true);
    });
  });

  test('rejects invalid assigneeId (not a UUID)', () => {
    const result = createTaskSchema.safeParse({ title: 'Task', assigneeId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  test('accepts null assigneeId', () => {
    const result = createTaskSchema.safeParse({ title: 'Task', assigneeId: null });
    expect(result.success).toBe(true);
  });
});
