# Naiosh Law

Arabic RTL demo platform for legal-office operations, built with Next.js App Router.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Demo authentication

The login page supports one-click demo access for admin and client roles in local development. Passwords are validated only on the server and sessions are stored in an httpOnly signed cookie.

Set one of these secrets outside local development:

```bash
NAIOSH_SESSION_SECRET=replace-with-a-long-random-secret
# or AUTH_SECRET / NEXTAUTH_SECRET
```

For local development, a demo fallback secret is used. In production, missing secrets cause login to fail closed unless `NAIOSH_ALLOW_DEMO_SESSION_SECRET=true` is set intentionally. Production one-click demo login is disabled unless `NAIOSH_ENABLE_DEMO_LOGIN=true` is set.

## Available scripts

```bash
npm run lint
npm run typecheck
npm run build
```

## Demo APIs

The app includes mock integration route handlers for:

- `/api/sms`
- `/api/email`
- `/api/payments`
- `/api/sign`
- `/api/courts`
- `/api/tax`
- `/api/ocr`
- `/api/analytics`

These endpoints require an authenticated admin session. Unknown integrations return `404`; invalid JSON returns `400`; oversized JSON returns `413`; unsupported or missing POST content types return `415`. Empty POST bodies are accepted only when the request explicitly uses `Content-Type: application/json`.

## Data persistence

Operational module edits and dashboard task checks are demo data persisted in browser `localStorage` per signed-in user. No external database is configured in this repository.
