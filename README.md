# Naiosh Law

واجهة عربية تجريبية لنظام إدارة قانوني مبنية باستخدام Next.js App Router وReact.

## Getting Started

Install dependencies, then run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Verification

Use these checks before shipping changes:

```bash
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

## Demo runtime notes

- Authentication is demo-only but uses a signed httpOnly cookie plus a browser `localStorage` mirror for UI state.
- Set `NAIOSH_SESSION_SECRET` (or `AUTH_SECRET` / `NEXTAUTH_SECRET`) in production. To intentionally allow the local demo fallback secret in production, set `NAIOSH_ALLOW_DEMO_SESSION_SECRET=true`.
- Copy `.env.example` to `.env.local` for local secret configuration when testing production-like builds.
- Demo account metadata is defined in `src/data/auth.ts`; password-bearing demo credentials are only used by server auth routes.
- There is no database, ORM, or migration layer in this repository.
- Module CRUD changes are in-memory demo interactions; reloading a page restores seeded data.
- Demo integration endpoints are implemented under `src/app/api/[integration]/route.ts` and require an authenticated admin session.
- Auth endpoints are implemented under `src/app/api/auth/*`.

## Main routes

- `/` public landing page.
- `/login` demo login.
- `/app/dashboard` protected client dashboard.
- `/app/modules/[slug]` operational module pages.
