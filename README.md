# Naiosh Law

Arabic RTL legal-operations dashboard built with Next.js App Router, React, Tailwind CSS, and Framer Motion.

## Getting Started

Install dependencies and copy the environment template:

```bash
cp .env.example .env.local
npm ci
```

Use a long random `NAIOSH_SESSION_SECRET` value outside local demos. The app also recognizes `AUTH_SECRET` and
`NEXTAUTH_SECRET` as fallback secret names. Production requests fail closed without one of these values unless
`NAIOSH_ALLOW_DEMO_SESSION_SECRET=true` is set for a deliberate temporary demo deployment.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Demo access

The login page includes demo admin and client profiles. Manual demo credentials are:

- `admin@naioshlaw.com` / `Admin@123`
- `client@naioshlaw.com` / `Client@123`

Session state is signed in an httpOnly cookie. Client storage is only used as a UI cache for the demo experience.
In production, demo login is disabled unless `NAIOSH_ENABLE_DEMO_LOGIN=true` is configured.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Data model

This repository currently ships static demo module data. Module add/edit/delete actions persist to guarded browser
`localStorage` per module so demo changes survive refreshes, but there is no database, ORM, or migration layer yet.

Integration demo endpoints are available at `/api/sms`, `/api/email`, `/api/payments`, `/api/sign`, `/api/courts`,
`/api/tax`, `/api/ocr`, and `/api/analytics`.
