import { Pool, type PoolConfig } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function needsSsl(connectionString: string) {
  return (
    process.env.NODE_ENV === "production" ||
    connectionString.includes("railway") ||
    connectionString.includes("rlwy.net") ||
    connectionString.includes("sslmode=require") ||
    connectionString.includes("ssl=true")
  );
}

function getConnectionString(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.DATABASE_PUBLIC_URL,
    process.env.POSTGRES_URL,
  ];

  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed && !trimmed.startsWith("${")) {
      return trimmed;
    }
  }

  const host = process.env.PGHOST?.trim();
  const user = process.env.PGUSER?.trim();
  const password = process.env.PGPASSWORD?.trim();
  const database = process.env.PGDATABASE?.trim() || process.env.POSTGRES_DB?.trim();
  const port = process.env.PGPORT?.trim() || "5432";

  if (host && user && password && database) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  return undefined;
}

export function getDatabaseEnvStatus() {
  return {
    DATABASE_URL: Boolean(process.env.DATABASE_URL?.trim()),
    DATABASE_PUBLIC_URL: Boolean(process.env.DATABASE_PUBLIC_URL?.trim()),
    POSTGRES_URL: Boolean(process.env.POSTGRES_URL?.trim()),
    PGHOST: Boolean(process.env.PGHOST?.trim()),
    resolved: Boolean(getConnectionString()),
  };
}

function createPool(connectionString: string) {
  const config: PoolConfig = {
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  };

  if (needsSsl(connectionString)) {
    config.ssl = { rejectUnauthorized: false };
  }

  return new Pool(config);
}

function createPrismaClient() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = globalForPrisma.pool ?? createPool(connectionString);
  globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/** @deprecated Use getPrisma() — kept for existing imports */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = client[prop as keyof PrismaClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export async function checkDatabaseConnection() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    return { ok: false as const, error: "DATABASE_URL is not set" };
  }

  const pool = createPool(connectionString);
  try {
    await pool.query("SELECT 1");
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false as const, error: message };
  } finally {
    await pool.end();
  }
}
