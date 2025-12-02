// web/lib/prisma.ts

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Prisma 7 erwartet bei SQLite einen Driver-Adapter.
// Wir nutzen DATABASE_URL aus .env, z. B. "file:./prisma/dev.db".

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    'DATABASE_URL environment variable is required for Prisma (SQLite)',
  );
}

// Aktueller Adapter-API-Stand: Konfiguration per { url: string }
const adapter = new PrismaBetterSqlite3({
  url: dbUrl,
});

// Globales Caching für Next.js Hot-Reload
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  (globalForPrisma.prisma = new PrismaClient({
    adapter,
  }));

export default prisma;
