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
- Set `NAIOSH_SESSION_SECRET` (or `AUTH_SECRET` / `NEXTAUTH_SECRET`) in production. If none is provided, the demo fallback secret keeps previews usable but should not be used for real deployments.
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
