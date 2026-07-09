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
- Production deployments must set `NAIOSH_SESSION_SECRET`, `AUTH_SECRET`, or `NEXTAUTH_SECRET` for session signing. The demo fallback secret is available only outside production unless `NAIOSH_ALLOW_DEMO_SESSION_SECRET=true` is set deliberately.

## API behavior

- Auth endpoints accept JSON object payloads only and return `400`, `413`, or `415` for malformed, oversized, or unsupported request bodies.
- Demo integration endpoints under `/api/{sms,email,payments,sign,courts,tax,ocr,analytics}` require an authenticated admin session.
- Integration `POST` requests accept an empty body as an empty JSON payload for simple connection checks.

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
