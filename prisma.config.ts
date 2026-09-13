import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { defineConfig, env } from "prisma/config";

// Next.js keeps env vars in .env.local; load it explicitly for the Prisma CLI.
loadEnv({ path: resolve(".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
