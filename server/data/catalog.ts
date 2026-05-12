import "server-only";

import type { Product } from "@/shared/types/product";
import rawCatalog from "./catalog.json";

// Loaded once at module init. No mutation — treat as immutable.
// M8: swap this module's internals for a Prisma/SQLite query; exports unchanged.
export const catalog: Product[] = rawCatalog as Product[];
