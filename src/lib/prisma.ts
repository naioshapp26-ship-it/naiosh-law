import { Pool, type PoolConfig } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getConnectionString, getDatabaseEnvStatus } from "@/lib/database-url";

export { getDatabaseEnvStatus };

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function resolveSsl(connectionString: string): PoolConfig["ssl"] {
  const host = process.env.PGHOST?.trim() || connectionString;
  // اتصال داخلي على Railway — بدون SSL
  if (host.includes(".railway.internal")) {
    return false;
  }
  if (
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RAILWAY_ENVIRONMENT) ||
    Boolean(process.env.PGHOST) ||
    connectionString.includes("railway") ||
    connectionString.includes("rlwy.net")
  ) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

function createPool(connectionString: string) {
  const config: PoolConfig = {
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    ssl: resolveSsl(connectionString),
  };

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
