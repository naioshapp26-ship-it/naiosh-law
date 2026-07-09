# Naiosh Law

Next.js App Router application for the Naiosh Law ERP prototype. The app uses Prisma with PostgreSQL for auth, cases, clients, court sessions, legal taxonomy, professional network, official entities, and legal library data.

## Requirements

- Node.js 20+
- PostgreSQL
- A configured `.env` file based on `.env.example`

## Local setup

```bash
cp .env.example .env
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `DATABASE_POOL_MAX`: Optional PostgreSQL pool size, defaults to `5`.
- `JWT_SECRET`: Long random signing secret. `AUTH_SECRET` and `NEXTAUTH_SECRET` are also accepted.
- `NAIOSH_REQUIRE_SESSION_SECRET`: Set to `true` to fail closed when no signing secret is configured.

## Demo accounts

Seed data creates demo users shown on the login page. Use `npm run db:seed` after migrations to populate them.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run build
```

`npm run build` runs `prisma generate` before compiling Next.js.
