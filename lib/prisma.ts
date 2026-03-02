import { PrismaClient } from '@prisma/client';
import path from 'path';
import { config } from 'dotenv';

// Ensure DATABASE_URL is set (Next.js may not load .env in all server contexts)
config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), '.env.local') });

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Keep terminal noise low during DB outages unless explicitly debugging Prisma.
    log:
      process.env.NODE_ENV === 'development'
        ? (process.env.PRISMA_DEBUG === '1' ? ['query', 'warn', 'error'] : ['warn'])
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

