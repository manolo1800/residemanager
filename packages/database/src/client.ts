import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";
import { sql } from "drizzle-orm";

export function createDatabaseClient(connectionString: string) {
  const queryClient = postgres(connectionString, { max: 10 });
  const db = drizzle(queryClient, { schema });
  return { db, queryClient };
}

export type Database = ReturnType<typeof createDatabaseClient>["db"];

/**
 * Sets session configuration variables for PostgreSQL RLS policies in a transaction.
 */
export async function setTenantSessionContext(
  tx: any,
  context: { tenantId: string; condominiumId?: string }
) {
  await tx.execute(
    sql.raw(`SET LOCAL app.tenant_id = '${context.tenantId.replace(/'/g, "''")}';`)
  );
  if (context.condominiumId) {
    await tx.execute(
      sql.raw(
        `SET LOCAL app.condominium_id = '${context.condominiumId.replace(/'/g, "''")}';`
      )
    );
  }
}
