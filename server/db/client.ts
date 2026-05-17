import "server-only";

import { Pool } from "pg";

import { getDatabaseUrl } from "@/server/db/config";

let pool: Pool | undefined;

export function getDatabasePool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }

  return pool;
}
