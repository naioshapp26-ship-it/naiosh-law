#!/usr/bin/env bash
set -e

has_db=false
if [ -n "${DATABASE_URL:-}" ] || [ -n "${DATABASE_PUBLIC_URL:-}" ] || [ -n "${PGHOST:-}" ]; then
  has_db=true
fi

if [ "$has_db" = false ]; then
  echo "WARNING: DATABASE_URL is not set — skipping migrations"
else
  echo "Running database migrations..."
  if ! npx prisma migrate deploy; then
    echo "WARNING: prisma migrate deploy failed — starting app for diagnostics"
  fi
fi

exec npx next start
