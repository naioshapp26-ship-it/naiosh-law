# Naiosh Law

Arabic RTL demo application for a legal practice management platform. The app is built with Next.js App Router and includes protected dashboard/module routes, demo authentication, and local browser persistence for module records.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Demo authentication

- Use the quick demo buttons on `/login` for admin or client access.
- Manual demo credentials are validated only on the server.
- Protected `/app/*` routes require a signed httpOnly session cookie.
- Client session state is mirrored in `localStorage` only for UI hydration and is revalidated against `/api/auth/session`.

## Data model

This repository does not include a production database or migrations. Module tables are seeded from `src/data/module-configs.tsx` and persisted per browser in `localStorage` for demo workflows.

## Verification

```bash
npm run lint
npm run build
npm run typecheck
npm audit --audit-level=moderate
```

## Key paths

- `src/app/api/auth/*` - login, logout, and session validation.
- `src/app/api/[integration]/route.ts` - authenticated demo integration endpoints.
- `src/lib/session-shared.ts` - shared signed session token helpers.
- `src/lib/module-routing.ts` - module URLs and role visibility.
- `src/components/module-shell.tsx` - module CRUD demo shell.
