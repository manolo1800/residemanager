import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import {
  residentLinkRequests,
  residentProfiles,
  users,
  condominiums,
} from "@sgc/database";
import { and, desc, eq, isNull } from "drizzle-orm";

@Injectable()
export class ResidentLinkRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findRequestById(id: string, tenantId: string) {
    const results = await this.dbService.db
      .select({
        request: residentLinkRequests,
        user: users,
        condominium: condominiums,
      })
      .from(residentLinkRequests)
      .innerJoin(users, eq(residentLinkRequests.userId, users.id))
      .innerJoin(condominiums, eq(residentLinkRequests.condominiumId, condominiums.id))
      .where(
        and(
          eq(residentLinkRequests.id, id),
          eq(residentLinkRequests.tenantId, tenantId),
          isNull(residentLinkRequests.deletedAt)
        )
      );

    if (!results[0]) return null;
    return {
      ...results[0].request,
      user: {
        id: results[0].user.id,
        email: results[0].user.email,
        fullName: results[0].user.fullName,
        phone: results[0].user.phone,
      },
      condominium: {
        id: results[0].condominium.id,
        code: results[0].condominium.code,
        name: results[0].condominium.name,
        address: results[0].condominium.address,
      },
    };
  }

  async listRequests(condominiumId?: string, tenantId?: string, status?: string, userId?: string) {
    const conditions = [isNull(residentLinkRequests.deletedAt)];
    if (tenantId) {
      conditions.push(eq(residentLinkRequests.tenantId, tenantId));
    }
    if (condominiumId) {
      conditions.push(eq(residentLinkRequests.condominiumId, condominiumId));
    }
    if (status) {
      conditions.push(eq(residentLinkRequests.status, status));
    }
    if (userId) {
      conditions.push(eq(residentLinkRequests.userId, userId));
    }

    const results = await this.dbService.db
      .select({
        request: residentLinkRequests,
        user: users,
        condominium: condominiums,
      })
      .from(residentLinkRequests)
      .innerJoin(users, eq(residentLinkRequests.userId, users.id))
      .innerJoin(condominiums, eq(residentLinkRequests.condominiumId, condominiums.id))
      .where(and(...conditions))
      .orderBy(desc(residentLinkRequests.createdAt));

    return results.map((r) => ({
      ...r.request,
      user: {
        id: r.user.id,
        email: r.user.email,
        fullName: r.user.fullName,
        phone: r.user.phone,
      },
      condominium: {
        id: r.condominium.id,
        code: r.condominium.code,
        name: r.condominium.name,
        address: r.condominium.address,
      },
    }));
  }

  async createRequest(data: {
    tenantId: string;
    userId: string;
    condominiumId: string;
    unitCode: string;
  }) {
    const [inserted] = await this.dbService.db
      .insert(residentLinkRequests)
      .values({
        tenantId: data.tenantId,
        userId: data.userId,
        condominiumId: data.condominiumId,
        unitCode: data.unitCode.trim().toUpperCase(),
        status: "pending",
      })
      .returning();
    return inserted;
  }

  async updateRequest(
    id: string,
    tenantId: string,
    data: Partial<typeof residentLinkRequests.$inferInsert>
  ) {
    const [updated] = await this.dbService.db
      .update(residentLinkRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(residentLinkRequests.id, id),
          eq(residentLinkRequests.tenantId, tenantId),
          isNull(residentLinkRequests.deletedAt)
        )
      )
      .returning();
    return updated;
  }

  async findProfile(userId: string, tenantId: string) {
    const results = await this.dbService.db
      .select()
      .from(residentProfiles)
      .where(
        and(
          eq(residentProfiles.userId, userId),
          eq(residentProfiles.tenantId, tenantId),
          isNull(residentProfiles.deletedAt)
        )
      );
    return results[0] || null;
  }

  async createProfile(userId: string, personId: string, tenantId: string) {
    const [inserted] = await this.dbService.db
      .insert(residentProfiles)
      .values({
        userId,
        personId,
        tenantId,
      })
      .returning();
    return inserted;
  }
}
