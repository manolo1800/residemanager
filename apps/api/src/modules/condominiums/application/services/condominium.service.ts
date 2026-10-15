import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CondominiumRepository } from "../../infrastructure/repositories/condominium.repository";
import { RequestContextStore } from "../../../../common/context/request-context";
import {
  CreateCondominiumRequest,
  UpdateCondominiumRequest,
  UpdateCondominiumSettingsRequest,
} from "@sgc/contracts";

@Injectable()
export class CondominiumService {
  constructor(private readonly condoRepo: CondominiumRepository) {}

  async listCondominiums() {
    const ctx = RequestContextStore.getOrThrow();
    return this.condoRepo.findAllForTenant(ctx.tenantId);
  }

  async searchCondominiums(query: string) {
    const ctx = RequestContextStore.getOrThrow();
    if (!query || query.trim().length === 0) {
      return this.condoRepo.findAllForTenant(ctx.tenantId);
    }
    return this.condoRepo.search(query, ctx.tenantId);
  }

  async searchPublicCondominiums(query: string) {
    return this.condoRepo.searchPublic(query || "");
  }

  async getCondominium(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.condoRepo.findById(id, ctx.tenantId);
    if (!condo) {
      throw new NotFoundException("Condominio no encontrado");
    }
    return condo;
  }

  async createCondominium(dto: CreateCondominiumRequest) {
    const ctx = RequestContextStore.getOrThrow();

    const existing = await this.condoRepo.findByCode(dto.code, ctx.tenantId);
    if (existing) {
      throw new BadRequestException(`El código '${dto.code}' ya existe en esta administradora`);
    }

    const created = await this.condoRepo.create({
      tenantId: ctx.tenantId,
      code: dto.code.toUpperCase().trim(),
      name: dto.name,
      type: dto.type,
      address: dto.address,
      country: dto.country,
      timezone: dto.timezone,
      dateFormat: dto.dateFormat || "DD/MM/YYYY",
      baseCurrency: dto.baseCurrency,
      foreignCurrency: dto.foreignCurrency || null,
      foreignCurrencyEnabled: dto.foreignCurrencyEnabled || false,
      taxExempt: dto.taxExempt || false,
      taxRate: dto.taxRate ? String(dto.taxRate) : null,
      taxIncludedInFee: dto.taxIncludedInFee ?? true,
      ordinaryFeeMode: dto.ordinaryFeeMode || "fixed",
      extraordinaryRequiresMeeting: dto.extraordinaryRequiresMeeting ?? true,
      moraType: dto.moraType || "percentage",
      moraValue: dto.moraValue ? String(dto.moraValue) : "0",
      partialPaymentsEnabled: dto.partialPaymentsEnabled || false,
      partialPaymentInterestEnabled: dto.partialPaymentInterestEnabled || false,
      termsOwnEnabled: dto.termsOwnEnabled || false,
      termsOwnContent: dto.termsOwnContent || null,
      branding: dto.branding || null,
      status: "active",
    });

    if (ctx.userId) {
      await this.condoRepo.assignUserAccess(ctx.userId, created.id, "condo_admin");
    }

    return created;
  }

  async updateCondominium(id: string, dto: UpdateCondominiumRequest) {
    const ctx = RequestContextStore.getOrThrow();
    await this.getCondominium(id);
    const updateData: any = { ...dto };
    if (dto.taxRate !== undefined) updateData.taxRate = dto.taxRate ? String(dto.taxRate) : null;
    if (dto.moraValue !== undefined) updateData.moraValue = dto.moraValue ? String(dto.moraValue) : "0";
    return this.condoRepo.update(id, ctx.tenantId, updateData);
  }

  async updateSettings(id: string, dto: UpdateCondominiumSettingsRequest) {
    const ctx = RequestContextStore.getOrThrow();
    await this.getCondominium(id);

    const updateData: any = { ...dto };
    if (dto.taxRate !== undefined) updateData.taxRate = dto.taxRate ? String(dto.taxRate) : null;
    if (dto.moraValue !== undefined) updateData.moraValue = dto.moraValue ? String(dto.moraValue) : "0";

    return this.condoRepo.update(id, ctx.tenantId, updateData);
  }

  async deleteCondominium(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    await this.getCondominium(id);
    return this.condoRepo.softDelete(id, ctx.tenantId);
  }
}
