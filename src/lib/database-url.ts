/** يبني رابط PostgreSQL من متغيرات Railway (يدعم DATABASE_URL أو PGHOST/PGUSER/...) */

export function getConnectionString(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.DATABASE_PUBLIC_URL,
    process.env.POSTGRES_URL,
  ];

  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed && !trimmed.startsWith("${") && trimmed.length > 10) {
      return trimmed;
    }
  }

  const host = process.env.PGHOST?.trim();
  const user = process.env.PGUSER?.trim() || process.env.POSTGRES_USER?.trim() || "postgres";
  const password = process.env.PGPASSWORD?.trim() || process.env.POSTGRES_PASSWORD?.trim();
  const database =
    process.env.PGDATABASE?.trim() ||
    process.env.POSTGRES_DB?.trim() ||
    "railway";
  const port = process.env.PGPORT?.trim() || "5432";

  if (host && password) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  return undefined;
}

export function getDatabaseEnvStatus() {
  const host = process.env.PGHOST?.trim() || "";
  return {
    DATABASE_URL: Boolean(process.env.DATABASE_URL?.trim()),
    DATABASE_PUBLIC_URL: Boolean(process.env.DATABASE_PUBLIC_URL?.trim()),
    PGHOST: Boolean(host),
    PGUSER: Boolean(process.env.PGUSER?.trim()),
    PGPASSWORD: Boolean(process.env.PGPASSWORD?.trim()),
    PGDATABASE: Boolean(
      process.env.PGDATABASE?.trim() || process.env.POSTGRES_DB?.trim()
    ),
    internalHost: host.includes(".railway.internal"),
    resolved: Boolean(getConnectionString()),
  };
}
