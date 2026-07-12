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
  const connectionString = process.env.DATABASE_URL;
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
  const connectionString = process.env.DATABASE_URL;
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
