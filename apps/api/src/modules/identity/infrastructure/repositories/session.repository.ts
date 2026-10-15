import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { sessions } from "@sgc/database";
import { eq, and, gt } from "drizzle-orm";

@Injectable()
export class SessionRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: {
    userId: string;
    tenantId: string;
    activeCondominiumId?: string | null;
    refreshTokenHash: string;
    expiresAt: Date;
    ip?: string;
    userAgent?: string;
  }) {
    const [inserted] = await this.dbService.db
      .insert(sessions)
      .values({
        userId: data.userId,
        tenantId: data.tenantId,
        activeCondominiumId: data.activeCondominiumId || null,
        refreshTokenHash: data.refreshTokenHash,
        expiresAt: data.expiresAt,
        ip: data.ip || null,
        userAgent: data.userAgent || null,
      })
      .returning();
    return inserted;
  }

  async findValidSessionByRefreshHash(hash: string) {
    const results = await this.dbService.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.refreshTokenHash, hash),
          gt(sessions.expiresAt, new Date())
        )
      );
    return results[0] || null;
  }

  async delete(sessionId: string) {
    await this.dbService.db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async deleteAllForUser(userId: string) {
    await this.dbService.db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async updateActiveCondominium(sessionId: string, condoId: string) {
    await this.dbService.db
      .update(sessions)
      .set({ activeCondominiumId: condoId })
      .where(eq(sessions.id, sessionId));
  }
}
