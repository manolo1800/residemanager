import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ParkingSpotRepository } from "../../infrastructure/repositories/parking-spot.repository";
import { UnitRepository } from "../../infrastructure/repositories/unit.repository";
import { CondominiumRepository } from "../../infrastructure/repositories/condominium.repository";
import { RequestContextStore } from "../../../../common/context/request-context";
import { CreateParkingSpotRequest, UpdateParkingSpotRequest } from "@sgc/contracts";

@Injectable()
export class ParkingSpotService {
  constructor(
    private readonly parkingRepo: ParkingSpotRepository,
    private readonly unitRepo: UnitRepository,
    private readonly condoRepo: CondominiumRepository
  ) {}

  private async ensureCondoExists(condominiumId: string, tenantId: string) {
    const condo = await this.condoRepo.findById(condominiumId, tenantId);
    if (!condo) {
      throw new NotFoundException("Condominio no encontrado");
    }
    return condo;
  }

  async listParkingSpots(condominiumId: string) {
    const ctx = RequestContextStore.getOrThrow();
    await this.ensureCondoExists(condominiumId, ctx.tenantId);
    return this.parkingRepo.findAll(condominiumId, ctx.tenantId);
  }

  async getParkingSpot(condominiumId: string, id: string) {
    const ctx = RequestContextStore.getOrThrow();
    await this.ensureCondoExists(condominiumId, ctx.tenantId);
    const spot = await this.parkingRepo.findById(id, condominiumId, ctx.tenantId);
    if (!spot) {
      throw new NotFoundException("Estacionamiento no encontrado");
    }
    return spot;
  }

  async createParkingSpot(condominiumId: string, dto: CreateParkingSpotRequest) {
    const ctx = RequestContextStore.getOrThrow();
    await this.ensureCondoExists(condominiumId, ctx.tenantId);

    const existing = await this.parkingRepo.findByCode(dto.code, condominiumId, ctx.tenantId);
    if (existing) {
      throw new BadRequestException(
        `Ya existe un estacionamiento con el código '${dto.code}' en este condominio`
      );
    }

    if (dto.assignedUnitId) {
      const unit = await this.unitRepo.findById(dto.assignedUnitId, condominiumId, ctx.tenantId);
      if (!unit) {
        throw new BadRequestException("La unidad asignada no pertenece a este condominio");
      }
    }

    return this.parkingRepo.create({
      tenantId: ctx.tenantId,
      condominiumId,
      code: dto.code.trim().toUpperCase(),
      type: dto.type,
      assignedUnitId: dto.assignedUnitId || null,
    });
  }

  async updateParkingSpot(condominiumId: string, id: string, dto: UpdateParkingSpotRequest) {
    const ctx = RequestContextStore.getOrThrow();
    await this.getParkingSpot(condominiumId, id);

    if (dto.code) {
      const existing = await this.parkingRepo.findByCode(dto.code, condominiumId, ctx.tenantId);
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Ya existe un estacionamiento con el código '${dto.code}'`);
      }
    }

    if (dto.assignedUnitId) {
      const unit = await this.unitRepo.findById(dto.assignedUnitId, condominiumId, ctx.tenantId);
      if (!unit) {
        throw new BadRequestException("La unidad asignada no pertenece a este condominio");
      }
    }

    return this.parkingRepo.update(id, condominiumId, ctx.tenantId, {
      ...(dto.code ? { code: dto.code.trim().toUpperCase() } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.assignedUnitId !== undefined ? { assignedUnitId: dto.assignedUnitId } : {}),
    });
  }

  async deleteParkingSpot(condominiumId: string, id: string) {
    const ctx = RequestContextStore.getOrThrow();
    await this.getParkingSpot(condominiumId, id);
    return this.parkingRepo.softDelete(id, condominiumId, ctx.tenantId);
  }
}
