import "server-only";

import { Pool } from "pg";

import { getDatabaseUrl } from "@/server/db/config";

interface GlobalWithDatabasePool {
  __productAssistantDbPool?: Pool;
}

const globalForDatabasePool = globalThis as typeof globalThis & GlobalWithDatabasePool;
const DEFAULT_POOL_MAX_CONNECTIONS = 10;
const DEFAULT_CONNECTION_TIMEOUT_MS = 10_000;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;

export function getDatabasePool(): Pool {
  if (!globalForDatabasePool.__productAssistantDbPool) {
    globalForDatabasePool.__productAssistantDbPool = new Pool({
      connectionString: getDatabaseUrl(),
      max: DEFAULT_POOL_MAX_CONNECTIONS,
      connectionTimeoutMillis: DEFAULT_CONNECTION_TIMEOUT_MS,
      idleTimeoutMillis: DEFAULT_IDLE_TIMEOUT_MS,
    });
  }

  return globalForDatabasePool.__productAssistantDbPool;
}
