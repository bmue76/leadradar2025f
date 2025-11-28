// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

/**
 * Prisma-Client als Singleton, um Probleme mit
 * Hot-Reloading im Next.js Dev-Server zu vermeiden.
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
