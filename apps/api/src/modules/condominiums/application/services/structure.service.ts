import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { StructureRepository } from "../../infrastructure/repositories/structure.repository";
import { CondominiumRepository } from "../../infrastructure/repositories/condominium.repository";
import { RequestContextStore } from "../../../../common/context/request-context";
import { CreateStructureRequest, UpdateStructureRequest } from "@sgc/contracts";

@Injectable()
export class StructureService {
  constructor(
    private readonly structureRepo: StructureRepository,
    private readonly condoRepo: CondominiumRepository
  ) {}

  private async ensureCondoExists(condominiumId: string, tenantId: string) {
    const condo = await this.condoRepo.findById(condominiumId, tenantId);
    if (!condo) {
      throw new NotFoundException("Condominio no encontrado");
    }
    return condo;
  }

  async listStructures(condominiumId: string) {
    const ctx = RequestContextStore.getOrThrow();
    await this.ensureCondoExists(condominiumId, ctx.tenantId);
    return this.structureRepo.findByCondo(condominiumId, ctx.tenantId);
  }

  async getStructure(condominiumId: string, id: string) {
    const ctx = RequestContextStore.getOrThrow();
    await this.ensureCondoExists(condominiumId, ctx.tenantId);
    const structure = await this.structureRepo.findById(id, condominiumId, ctx.tenantId);
    if (!structure) {
      throw new NotFoundException("Estructura no encontrada");
    }
    return structure;
  }

  async createStructure(condominiumId: string, dto: CreateStructureRequest) {
    const ctx = RequestContextStore.getOrThrow();
    await this.ensureCondoExists(condominiumId, ctx.tenantId);

    const existing = await this.structureRepo.findByName(dto.name, condominiumId, ctx.tenantId);
    if (existing) {
      throw new BadRequestException(`Ya existe una estructura con el nombre '${dto.name}' en este condominio`);
    }

    return this.structureRepo.create({
      tenantId: ctx.tenantId,
      condominiumId,
      name: dto.name.trim(),
      kind: dto.kind,
      floors: dto.floors ?? null,
      position: dto.position ?? 0,
    });
  }

  async updateStructure(condominiumId: string, id: string, dto: UpdateStructureRequest) {
    const ctx = RequestContextStore.getOrThrow();
    await this.getStructure(condominiumId, id);

    if (dto.name) {
      const existing = await this.structureRepo.findByName(dto.name, condominiumId, ctx.tenantId);
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Ya existe una estructura con el nombre '${dto.name}'`);
      }
    }

    return this.structureRepo.update(id, condominiumId, ctx.tenantId, {
      ...(dto.name ? { name: dto.name.trim() } : {}),
      ...(dto.kind ? { kind: dto.kind } : {}),
      ...(dto.floors !== undefined ? { floors: dto.floors } : {}),
      ...(dto.position !== undefined ? { position: dto.position } : {}),
    });
  }

  async deleteStructure(condominiumId: string, id: string) {
    const ctx = RequestContextStore.getOrThrow();
    await this.getStructure(condominiumId, id);

    const unitsCount = await this.structureRepo.countUnitsInStructure(id);
    if (unitsCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar la estructura porque tiene ${unitsCount} unidades asignadas. Reubique o elimine las unidades primero.`
      );
    }

    return this.structureRepo.softDelete(id, condominiumId, ctx.tenantId);
  }
}
