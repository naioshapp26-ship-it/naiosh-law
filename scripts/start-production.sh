#!/usr/bin/env bash
set -e

if [ -z "${DATABASE_URL:-}" ]; then
  echo "WARNING: DATABASE_URL is not set — skipping migrations"
else
  echo "Running database migrations..."
  if ! npx prisma migrate deploy; then
    echo "WARNING: prisma migrate deploy failed — starting app for diagnostics"
  fi
fi

exec npx next start
