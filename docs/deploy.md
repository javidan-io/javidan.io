# Deploying javidan.io

The site deploys through Coolify on the Hetzner server: every push to `main`
on GitHub triggers a build (Nixpacks) and a deploy.

`/filming` needs two services next to the app, both running as Coolify
resources on the same server:

| Service    | Used for                                   | Public?                                   |
| ---------- | ------------------------------------------ | ----------------------------------------- |
| PostgreSQL | Gallery items, descriptions, view counts   | No — reach it through an SSH tunnel       |
| MinIO      | Photos, videos, posters (bucket `media`)   | S3 API only, at `https://assets.javidan.io` |

## App environment (Coolify → javidan.io → Environment variables)

| Variable           | Example                                    | Build time? |
| ------------------ | ------------------------------------------ | ----------- |
| `DATABASE_URL`     | `postgres://…@<postgres-internal-host>:5432/javidan` | No  |
| `MEDIA_PUBLIC_URL` | `https://assets.javidan.io/media`          | **Yes** — `next.config.ts` reads it to allow image optimisation from that host |

Without `DATABASE_URL`, `/filming` falls back to the bundled placeholders.
The `S3_*` variables are only needed by the media scripts on your laptop,
not by the app.

## Working with production media from your laptop

1. Open an SSH tunnel to the production database (see *Database access*).
2. Create `.env.production.local` (git-ignored) with the production values:

   ```
   DATABASE_URL=postgres://…@localhost:<tunnel-port>/javidan
   S3_ENDPOINT=https://assets.javidan.io
   S3_REGION=us-east-1
   S3_ACCESS_KEY=…
   S3_SECRET_KEY=…
   S3_BUCKET=media
   MEDIA_PUBLIC_URL=https://assets.javidan.io/media
   ```

3. Run any media or database command with `MEDIA_ENV` pointing at it. The
   script prints which database it is using before it does anything:

   ```bash
   MEDIA_ENV=.env.production.local pnpm media:list
   MEDIA_ENV=.env.production.local pnpm media:add clip.mp4 --title "…"
   MEDIA_ENV=.env.production.local pnpm db:migrate
   ```

A misspelt `MEDIA_ENV` file stops the script instead of silently using local
settings.

## Database changes (migrations)

Schema changes live in `drizzle/`. After pulling a change that adds a
migration, apply it to production **before** pushing the code that needs it:

```bash
MEDIA_ENV=.env.production.local pnpm db:migrate
```

## Database access

Neither service is published on a port. Reach both through an SSH tunnel to
the containers' internal addresses (look them up again if a container was
recreated):

```bash
ssh root@2.28.115.183 'docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}" nsyr11opsefuvoufpfxuq79m $(docker ps -qf name=minio-mvmxacucj82zfcozlsz1gsra)'
ssh -N -L 5436:<postgres-ip>:5432 -L 9106:<minio-ip>:9000 root@2.28.115.183
```

With the tunnel open, `.env.production.local` points at `localhost:5436`
(Postgres) and `http://localhost:9106` (MinIO S3 API).

Coolify resources (project *Apps* → *production*):

- `javidan-filming-db` — PostgreSQL 18, database `javidan`, private.
- `javidan-assets` — MinIO (`chainguard/minio:latest`, the official images are
  no longer published), console disabled, S3 API at `https://assets.javidan.io`.
  After changing its domains: **General → Save**, then **Stop** and
  **Deploy** (a restart keeps the old routing).

## Local development

```bash
pnpm db:up        # Postgres :5434 + MinIO :9006 (console :9007)
pnpm db:migrate
pnpm db:seed      # optional: placeholder media
pnpm dev
```
