import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CommonAreaRepository } from "../../infrastructure/repositories/common-area.repository";
import { CondominiumRepository } from "../../infrastructure/repositories/condominium.repository";
import { RequestContextStore } from "../../../../common/context/request-context";
import { CreateCommonAreaRequest, UpdateCommonAreaRequest } from "@sgc/contracts";

@Injectable()
export class CommonAreaService {
  constructor(
    private readonly commonAreaRepo: CommonAreaRepository,
    private readonly condoRepo: CondominiumRepository
  ) {}

  private async ensureCondoExists(condominiumId: string, tenantId: string) {
    const condo = await this.condoRepo.findById(condominiumId, tenantId);
    if (!condo) {
      throw new NotFoundException("Condominio no encontrado");
    }
    return condo;
  }

  async listCommonAreas(condominiumId: string) {
    const ctx = RequestContextStore.getOrThrow();
    await this.ensureCondoExists(condominiumId, ctx.tenantId);
    return this.commonAreaRepo.findAll(condominiumId, ctx.tenantId);
  }

  async getCommonArea(condominiumId: string, id: string) {
    const ctx = RequestContextStore.getOrThrow();
    await this.ensureCondoExists(condominiumId, ctx.tenantId);
    const area = await this.commonAreaRepo.findById(id, condominiumId, ctx.tenantId);
    if (!area) {
      throw new NotFoundException("Área común no encontrada");
    }
    return area;
  }

  async createCommonArea(condominiumId: string, dto: CreateCommonAreaRequest) {
    const ctx = RequestContextStore.getOrThrow();
    await this.ensureCondoExists(condominiumId, ctx.tenantId);

    return this.commonAreaRepo.create({
      tenantId: ctx.tenantId,
      condominiumId,
      name: dto.name.trim(),
      type: dto.type,
      capacity: dto.capacity ?? null,
    });
  }

  async updateCommonArea(condominiumId: string, id: string, dto: UpdateCommonAreaRequest) {
    const ctx = RequestContextStore.getOrThrow();
    await this.getCommonArea(condominiumId, id);

    return this.commonAreaRepo.update(id, condominiumId, ctx.tenantId, {
      ...(dto.name ? { name: dto.name.trim() } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
    });
  }

  async deleteCommonArea(condominiumId: string, id: string) {
    const ctx = RequestContextStore.getOrThrow();
    await this.getCommonArea(condominiumId, id);
    return this.commonAreaRepo.softDelete(id, condominiumId, ctx.tenantId);
  }
}
