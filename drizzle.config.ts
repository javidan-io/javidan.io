import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(process.env.MEDIA_ENV ?? ".env.local");
} catch {
  // Fall back to the ambient environment (CI, Hetzner).
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/filming/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
