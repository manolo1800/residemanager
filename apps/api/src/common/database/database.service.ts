import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDatabaseClient, Database, setTenantSessionContext } from "@sgc/database";
import { RequestContextStore } from "../context/request-context";
import postgres from "postgres";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  public db!: Database;
  private queryClient!: postgres.Sql;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const connectionString =
      this.configService.get<string>("DATABASE_URL") ||
      "postgresql://postgres:postgres@localhost:5432/sgc";
    const { db, queryClient } = createDatabaseClient(connectionString);
    this.db = db;
    this.queryClient = queryClient;
  }

  async onModuleDestroy() {
    if (this.queryClient) {
      await this.queryClient.end();
    }
  }

  /**
   * Runs an operation inside a database transaction with PostgreSQL Row Level Security (RLS)
   * session variables automatically configured from current RequestContext.
   */
  async withContext<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    const ctx = RequestContextStore.get();
    return this.db.transaction(async (tx) => {
      if (ctx && ctx.tenantId) {
        await setTenantSessionContext(tx, {
          tenantId: ctx.tenantId,
          condominiumId: ctx.activeCondominiumId || undefined,
        });
      }
      return fn(tx);
    });
  }
}
