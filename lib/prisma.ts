import { PrismaClient } from '@prisma/client';
import path from 'path';
import { config } from 'dotenv';

// Ensure DATABASE_URL is set (Next.js may not load .env in all server contexts)
config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), '.env.local') });

function tuneDatabaseUrlForServerless(urlValue: string | undefined): string | undefined {
  if (!urlValue) return urlValue;

  try {
    const parsed = new URL(urlValue);
    const host = parsed.hostname.toLowerCase();
    const isSupabasePooler = host.includes('pooler.supabase.com');

    if (!isSupabasePooler) {
      return urlValue;
    }

    // Prevent pool exhaustion on Vercel preview/serverless by capping Prisma connections.
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', '1');
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '20');
    }
    if (!parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
    }

    return parsed.toString();
  } catch {
    return urlValue;
  }
}

process.env.DATABASE_URL = tuneDatabaseUrlForServerless(process.env.DATABASE_URL);

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

// Cache the Prisma instance globally in development to avoid multiple instances during hot reload
if (process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = prisma;
}

