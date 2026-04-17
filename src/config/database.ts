import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';
import logger from './logger';

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  const client = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

  client.$on('error' as never, (e: { message: string; target: string }) => {
    logger.error('Prisma error', { message: e.message, target: e.target });
  });

  client.$on('warn' as never, (e: { message: string; target: string }) => {
    logger.warn('Prisma warning', { message: e.message, target: e.target });
  });

  return client;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
