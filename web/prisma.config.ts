// web/prisma.config.ts
import 'dotenv/config';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    // Seed-Command für `npx prisma db seed`
    seed: 'node prisma/seed.cjs',
  },
  datasource: {
    // URL liegt jetzt zentral HIER (nicht mehr im schema.prisma)
    url: env('DATABASE_URL'),
  },
});
