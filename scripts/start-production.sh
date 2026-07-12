#!/usr/bin/env bash
set -e

# ابنِ DATABASE_URL من PGHOST إن لم يكن موجوداً (Railway)
if [ -z "${DATABASE_URL:-}" ] && [ -n "${PGHOST:-}" ] && [ -n "${PGPASSWORD:-}" ]; then
  PGUSER_VAL="${PGUSER:-postgres}"
  PGPORT_VAL="${PGPORT:-5432}"
  PGDB_VAL="${PGDATABASE:-${POSTGRES_DB:-railway}}"
  export DATABASE_URL="postgresql://${PGUSER_VAL}:${PGPASSWORD}@${PGHOST}:${PGPORT_VAL}/${PGDB_VAL}"
  echo "Built DATABASE_URL from PGHOST/PGUSER/PGPASSWORD"
fi

has_db=false
if [ -n "${DATABASE_URL:-}" ] || [ -n "${PGHOST:-}" ]; then
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
