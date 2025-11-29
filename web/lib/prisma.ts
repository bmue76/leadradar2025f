// web/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    'DATABASE_URL is not set. Please define it in your .env file (e.g. file:./prisma/dev.db).',
  );
}

const adapter = new PrismaBetterSqlite3({
  url: dbUrl,
});

declare global {
  // Damit Next.js den Client im Dev-Modus als Singleton nutzt
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export { prisma };
