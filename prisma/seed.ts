import { PrismaClient, Role, TaskStatus, TaskPriority } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('Password1', SALT_ROUNDS);

  // ─── Create Users ──────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { name: 'Alice Admin', email: 'admin@smartops.dev', password, role: Role.ADMIN },
  });

  const [manager1, manager2] = await Promise.all([
    prisma.user.create({
      data: { name: 'Bob Manager', email: 'manager1@smartops.dev', password, role: Role.MANAGER },
    }),
    prisma.user.create({
      data: { name: 'Carol Manager', email: 'manager2@smartops.dev', password, role: Role.MANAGER },
    }),
  ]);

  const users = await Promise.all(
    [
      { name: 'Dave Developer', email: 'user1@smartops.dev' },
      { name: 'Eve Engineer', email: 'user2@smartops.dev' },
      { name: 'Frank Frontend', email: 'user3@smartops.dev' },
      { name: 'Grace Backend', email: 'user4@smartops.dev' },
      { name: 'Hank DevOps', email: 'user5@smartops.dev' },
    ].map((u) =>
      prisma.user.create({ data: { ...u, password, role: Role.USER } })
    )
  );

  const allUsers = [admin, manager1, manager2, ...users];
  console.log(`✅ Created ${allUsers.length} users`);

  // ─── Create Tasks ──────────────────────────────────────────────────────────
  const taskData: Array<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeIndex: number;
    creatorIndex: number;
    daysFromNow?: number;
    tags: string[];
  }> = [
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      assigneeIndex: 7, // Hank
      creatorIndex: 0,
      daysFromNow: -5,
      tags: ['devops', 'infrastructure'],
    },
    {
      title: 'Design database schema',
      description: 'Create ERD and implement Prisma schema for all entities',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      assigneeIndex: 6, // Grace
      creatorIndex: 0,
      daysFromNow: -3,
      tags: ['backend', 'database'],
    },
    {
      title: 'Implement authentication module',
      description: 'JWT-based auth with access/refresh tokens, bcrypt password hashing',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      assigneeIndex: 6,
      creatorIndex: 1,
      daysFromNow: 2,
      tags: ['backend', 'auth'],
    },
    {
      title: 'Build Kanban board UI',
      description: 'React drag-and-drop board using @dnd-kit with optimistic updates',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assigneeIndex: 5, // Frank
      creatorIndex: 1,
      daysFromNow: 3,
      tags: ['frontend', 'ui'],
    },
    {
      title: 'Implement RBAC middleware',
      description: 'Role-based access control for Admin, Manager, and User roles',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      assigneeIndex: 6,
      creatorIndex: 0,
      daysFromNow: -1,
      tags: ['backend', 'security'],
    },
    {
      title: 'Create task API endpoints',
      description: 'CRUD + filters, pagination, status change, reorder endpoints',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      assigneeIndex: 6,
      creatorIndex: 1,
      daysFromNow: 1,
      tags: ['backend', 'api'],
    },
    {
      title: 'Redux store setup with RTK Query',
      description: 'Configure baseApi with reauth, split endpoints for all resources',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      assigneeIndex: 5,
      creatorIndex: 1,
      daysFromNow: 4,
      tags: ['frontend', 'state'],
    },
    {
      title: 'Design system with shadcn/ui',
      description: 'Set up Tailwind + shadcn components, dark mode support',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeIndex: 5,
      creatorIndex: 2,
      daysFromNow: 5,
      tags: ['frontend', 'design'],
    },
    {
      title: 'Activity log feature',
      description: 'Log all create/update/delete/assign actions with metadata',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      assigneeIndex: 6,
      creatorIndex: 0,
      daysFromNow: 3,
      tags: ['backend', 'feature'],
    },
    {
      title: 'Dashboard analytics page',
      description: 'Charts for task distribution, overdue tasks, workload per user',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeIndex: 5,
      creatorIndex: 1,
      daysFromNow: 7,
      tags: ['frontend', 'analytics'],
    },
    {
      title: 'Comment system',
      description: 'Add/edit/soft-delete comments on tasks with 15-min edit window',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      assigneeIndex: 3, // Dave
      creatorIndex: 2,
      daysFromNow: 6,
      tags: ['backend', 'frontend'],
    },
    {
      title: 'Write Jest unit tests',
      description: 'Tests for auth, RBAC middleware, task status transitions',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeIndex: 4, // Eve
      creatorIndex: 0,
      daysFromNow: 8,
      tags: ['testing'],
    },
    {
      title: 'API documentation with Swagger',
      description: 'Complete JSDoc annotations for all endpoints',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.LOW,
      assigneeIndex: 3,
      creatorIndex: 1,
      daysFromNow: 2,
      tags: ['docs'],
    },
    {
      title: 'Performance optimization',
      description: 'Add database indexes, implement query optimization for board view',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      assigneeIndex: 7,
      creatorIndex: 0,
      daysFromNow: 14,
      tags: ['performance', 'database'],
    },
    {
      title: 'Security audit',
      description: 'Review OWASP top 10, check for SQL injection and XSS vulnerabilities',
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      assigneeIndex: 4,
      creatorIndex: 0,
      daysFromNow: -2, // overdue
      tags: ['security', 'audit'],
    },
    {
      title: 'Mobile responsive design',
      description: 'Ensure all pages are responsive on tablet and mobile',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeIndex: 5,
      creatorIndex: 2,
      daysFromNow: 10,
      tags: ['frontend', 'responsive'],
    },
    {
      title: 'Error monitoring setup',
      description: 'Integrate error tracking and alerting for production',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      assigneeIndex: 7,
      creatorIndex: 0,
      daysFromNow: 12,
      tags: ['devops', 'monitoring'],
    },
    {
      title: 'Seed data and demo environment',
      description: 'Create realistic seed data for demos and testing',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.LOW,
      assigneeIndex: 3,
      creatorIndex: 1,
      daysFromNow: 1,
      tags: ['devops'],
    },
    {
      title: 'User onboarding flow',
      description: 'Welcome email, first-login tour, role assignment by admin',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeIndex: 5,
      creatorIndex: 2,
      daysFromNow: 15,
      tags: ['frontend', 'ux'],
    },
    {
      title: 'ENGINEERING.md documentation',
      description: 'System architecture, ERD, decisions, trade-offs, scaling strategy',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeIndex: 3,
      creatorIndex: 0,
      daysFromNow: 5,
      tags: ['docs'],
    },
  ];

  // Group by status to assign positions
  const statusPositions: Record<string, number> = {};

  const tasks = await Promise.all(
    taskData.map(async (t) => {
      const status = t.status;
      statusPositions[status] = (statusPositions[status] ?? 0) + 1000;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (t.daysFromNow ?? 7));

      return prisma.task.create({
        data: {
          title: t.title,
          description: t.description,
          status,
          priority: t.priority,
          dueDate,
          assigneeId: allUsers[t.assigneeIndex]?.id,
          createdById: allUsers[t.creatorIndex]!.id,
          tags: t.tags,
          position: statusPositions[status]!,
        },
      });
    })
  );

  console.log(`✅ Created ${tasks.length} tasks`);

  // ─── Create some comments ──────────────────────────────────────────────────
  const firstTask = tasks[0]!;
  await Promise.all([
    prisma.comment.create({
      data: {
        body: 'Great progress! The pipeline is running smoothly.',
        taskId: firstTask.id,
        authorId: admin.id,
      },
    }),
    prisma.comment.create({
      data: {
        body: 'I\'ve added the staging environment deployment as well.',
        taskId: firstTask.id,
        authorId: users[4]!.id,
      },
    }),
  ]);
  console.log('✅ Created sample comments');

  // ─── Create activity logs ──────────────────────────────────────────────────
  await Promise.all(
    tasks.slice(0, 5).map((t) =>
      prisma.activityLog.create({
        data: {
          actorId: admin.id,
          action: 'CREATED',
          entityType: 'TASK',
          entityId: t.id,
          taskId: t.id,
          metadata: { title: t.title },
        },
      })
    )
  );
  console.log('✅ Created sample activity logs');

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Demo credentials:');
  console.log('   Admin:   admin@smartops.dev     / Password1');
  console.log('   Manager: manager1@smartops.dev  / Password1');
  console.log('   Manager: manager2@smartops.dev  / Password1');
  console.log('   User:    user1@smartops.dev     / Password1');
  console.log('   User:    user2@smartops.dev     / Password1');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
