import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../../common/database/database.service";
import { persons } from "@sgc/database";
import { and, eq, ilike, isNull, or } from "drizzle-orm";
import { CreatePersonRequest, UpdatePersonRequest } from "@sgc/contracts";

@Injectable()
export class PersonRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findById(id: string, tenantId: string) {
    const results = await this.dbService.db
      .select()
      .from(persons)
      .where(and(eq(persons.id, id), eq(persons.tenantId, tenantId), isNull(persons.deletedAt)));
    return results[0] || null;
  }

  async findByDocument(documentType: string, documentNumber: string, tenantId: string) {
    const results = await this.dbService.db
      .select()
      .from(persons)
      .where(
        and(
          eq(persons.tenantId, tenantId),
          eq(persons.documentType, documentType),
          eq(persons.documentNumber, documentNumber),
          isNull(persons.deletedAt)
        )
      );
    return results[0] || null;
  }

  async findByEmail(email: string, tenantId: string) {
    const results = await this.dbService.db
      .select()
      .from(persons)
      .where(and(eq(persons.tenantId, tenantId), eq(persons.email, email), isNull(persons.deletedAt)));
    return results[0] || null;
  }

  async list(tenantId: string, search?: string) {
    const baseCondition = and(eq(persons.tenantId, tenantId), isNull(persons.deletedAt));
    if (search && search.trim().length > 0) {
      const pattern = `%${search.trim()}%`;
      return this.dbService.db
        .select()
        .from(persons)
        .where(
          and(
            baseCondition,
            or(
              ilike(persons.fullName, pattern),
              ilike(persons.documentNumber, pattern),
              ilike(persons.email, pattern)
            )
          )
        )
        .orderBy(persons.fullName);
    }

    return this.dbService.db
      .select()
      .from(persons)
      .where(baseCondition)
      .orderBy(persons.fullName);
  }

  async create(tenantId: string, data: CreatePersonRequest) {
    const [inserted] = await this.dbService.db
      .insert(persons)
      .values({
        tenantId,
        documentType: data.documentType,
        documentNumber: data.documentNumber.trim(),
        fullName: data.fullName.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
      })
      .returning();
    return inserted;
  }

  async update(id: string, tenantId: string, data: UpdatePersonRequest) {
    const [updated] = await this.dbService.db
      .update(persons)
      .set({
        ...(data.documentType && { documentType: data.documentType }),
        ...(data.documentNumber && { documentNumber: data.documentNumber.trim() }),
        ...(data.fullName && { fullName: data.fullName.trim() }),
        ...(data.email !== undefined && { email: data.email?.trim() || null }),
        ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
        updatedAt: new Date(),
      })
      .where(and(eq(persons.id, id), eq(persons.tenantId, tenantId), isNull(persons.deletedAt)))
      .returning();
    return updated;
  }
}
