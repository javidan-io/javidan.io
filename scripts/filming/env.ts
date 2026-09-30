// Imported first by every script so .env.local applies like it does in Next.
// Point at another file (e.g. production) with MEDIA_ENV=.env.production.local.
const file = process.env.MEDIA_ENV;

try {
  process.loadEnvFile(file ?? ".env.local");
} catch (error) {
  // An explicitly chosen file must exist; .env.local is optional.
  if (file) throw new Error(`MEDIA_ENV file not found: ${file}`, { cause: error });
}

if (file) console.log(`Using ${file} (${new URL(process.env.DATABASE_URL ?? "postgres://?").host || "no database"})`);
