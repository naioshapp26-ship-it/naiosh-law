# Naiosh Law

Arabic RTL demo application for a legal practice management platform built with
Next.js App Router. The app includes marketing pages, demo authentication,
dashboard views, operational modules, local demo CRUD persistence, and mock
integration API endpoints.

## Getting Started

Install dependencies from the lockfile:

```bash
npm ci
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

## Demo architecture

- Demo users are authenticated through `/api/auth/login`.
- Protected `/app` routes are guarded by middleware using an httpOnly demo
  session cookie.
- Client UI state mirrors the session in `localStorage` for hydration and
  cross-tab updates.
- Operational module rows are prototype data persisted in browser
  `localStorage`; there is no production database or ORM in this repository.
- Mock integrations are exposed through `/api/[integration]` for supported
  demo slugs such as `/api/sms`, `/api/email`, and `/api/payments`.

## Important paths

- `src/app` - App Router pages and API routes
- `src/components` - reusable UI and module shells
- `src/data` - module metadata and seed data
- `src/lib` - routing, session, and demo auth helpers

## Production notes

This repository is currently a frontend-focused demo. Before using it for real
customer data, replace demo auth with signed server sessions, add a persistent
database-backed data layer, enforce permissions server-side, and add rate
limiting/schema validation to API endpoints.
