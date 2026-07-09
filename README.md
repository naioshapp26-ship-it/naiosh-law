# Naiosh Law

Arabic RTL legal practice management demo built with Next.js App Router, React, and Tailwind CSS.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

## Authentication

The demo uses signed httpOnly cookies for protected `/app/*` routes and mirrors the active user in localStorage for client rendering.

Set a long random secret in production:

```bash
NAIOSH_SESSION_SECRET="replace-with-a-long-random-production-secret"
```

Demo users are defined server-side in `src/data/server-auth.ts`.

## Data

This branch does not include a database or ORM. Module tables are seeded from static configuration in `src/data/module-configs.tsx`, and client-side CRUD changes are in-memory for the current session.
