import "server-only";

const MISSING_DATABASE_URL_MESSAGE =
  "DATABASE_URL is required for database operations. Keep it server-side only and never expose it with NEXT_PUBLIC_*.";

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(MISSING_DATABASE_URL_MESSAGE);
  }

  return databaseUrl;
}
