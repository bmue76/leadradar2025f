// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Pfad zur Schema-Datei
  schema: "prisma/schema.prisma",

  // Wo Migrations abgelegt werden (Standardpfad)
  migrations: {
    path: "prisma/migrations",
  },

  // Hier kommt jetzt die DB-URL hin (statt im schema.prisma)
  datasource: {
    url: env("DATABASE_URL"),
  },
});
