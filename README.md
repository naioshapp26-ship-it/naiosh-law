# Naiosh Law

Arabic RTL legal ERP built with Next.js App Router, React 19, Prisma 7, and PostgreSQL.

## Requirements

- Node.js 20+
- PostgreSQL database
- Environment variables from `.env.example`

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
```

`JWT_SECRET` is required in production. Development falls back to a local demo secret.

## Development

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Verification

Use these checks before shipping changes:

```bash
npm run lint
npx tsc --noEmit
npx prisma validate
JWT_SECRET=verification-secret npm run build
npm audit --audit-level=moderate
```

## Database notes

- Prisma schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations`
- Seed script: `prisma/seed.ts`

The seed script resets demo data and should only run against local or disposable environments.
