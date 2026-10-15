import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UnitOwnershipRepository } from "../../infrastructure/repositories/unit-ownership.repository";
import { OwnershipTransferRepository } from "../../infrastructure/repositories/ownership-transfer.repository";
import { PersonRepository } from "../../infrastructure/repositories/person.repository";
import { CondominiumsFacade } from "../../../condominiums/condominiums.facade";
import { RequestContextStore } from "../../../../common/context/request-context";
import { AssignOwnerRequest, TransferOwnershipRequest } from "@sgc/contracts";

@Injectable()
export class OwnershipService {
  constructor(
    private readonly unitOwnershipRepo: UnitOwnershipRepository,
    private readonly transferRepo: OwnershipTransferRepository,
    private readonly personRepo: PersonRepository,
    private readonly condoFacade: CondominiumsFacade
  ) {}

  async listUnitOwnerships(condoId: string, unitId: string) {
    const ctx = RequestContextStore.getOrThrow();
    const unit = await this.condoFacade.getUnitById(unitId, condoId, ctx.tenantId);
    if (!unit) {
      throw new NotFoundException("Unidad no encontrada");
    }
    return this.unitOwnershipRepo.listForUnit(unitId, ctx.tenantId);
  }

  async assignOwner(condoId: string, unitId: string, dto: AssignOwnerRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const unit = await this.condoFacade.getUnitById(unitId, condoId, ctx.tenantId);
    if (!unit) {
      throw new NotFoundException("Unidad no encontrada");
    }

    const person = await this.personRepo.findById(dto.personId, ctx.tenantId);
    if (!person) {
      throw new NotFoundException("Persona/Propietario no encontrado");
    }

    // Check if unit currently has an active ownership
    const activeOwnership = await this.unitOwnershipRepo.findActiveForUnit(unitId, ctx.tenantId);
    if (activeOwnership) {
      if (activeOwnership.ownership.personId === dto.personId) {
        throw new BadRequestException("Esta persona ya es propietaria activa de la unidad");
      }
      // Set previous ownership to inactive or transferred
      await this.unitOwnershipRepo.update(activeOwnership.ownership.id, ctx.tenantId, {
        status: "inactive",
        endDate: dto.startDate || new Date().toISOString().split("T")[0],
      });
    }

    return this.unitOwnershipRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: condoId,
      unitId,
      personId: dto.personId,
      startDate: dto.startDate || new Date().toISOString().split("T")[0],
      isPrimaryResidence: dto.isPrimaryResidence ?? false,
      status: "active",
    });
  }

  async initiateTransfer(ownershipId: string, dto: TransferOwnershipRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const currentOwnership = await this.unitOwnershipRepo.findById(ownershipId, ctx.tenantId);
    if (!currentOwnership) {
      throw new NotFoundException("Titularidad no encontrada");
    }
    if (currentOwnership.ownership.status !== "active") {
      throw new BadRequestException("Solo se puede transferir una titularidad activa");
    }

    if (currentOwnership.ownership.personId === dto.toPersonId) {
      throw new BadRequestException("El nuevo propietario no puede ser la misma persona");
    }

    const toPerson = await this.personRepo.findById(dto.toPersonId, ctx.tenantId);
    if (!toPerson) {
      throw new NotFoundException("El nuevo propietario no existe");
    }

    return this.transferRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: currentOwnership.ownership.condominiumId,
      unitId: currentOwnership.ownership.unitId,
      fromPersonId: currentOwnership.ownership.personId,
      toPersonId: dto.toPersonId,
      contractFileUrl: dto.contractFileUrl,
    });
  }

  async listTransfers(condominiumId: string, status?: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.transferRepo.listForCondominium(condominiumId, ctx.tenantId, status);
  }

  async approveTransfer(transferId: string) {
    const ctx = RequestContextStore.getOrThrow();
    const transfer = await this.transferRepo.findById(transferId, ctx.tenantId);
    if (!transfer) {
      throw new NotFoundException("Solicitud de traspaso no encontrada");
    }
    if (transfer.status !== "pending") {
      throw new BadRequestException(`El traspaso ya se encuentra en estado '${transfer.status}'`);
    }

    // 1. Mark previous active ownership as 'transferred'
    const activeOwnership = await this.unitOwnershipRepo.findActiveForUnit(
      transfer.unitId,
      ctx.tenantId
    );
    const today = new Date().toISOString().split("T")[0];

    if (activeOwnership) {
      await this.unitOwnershipRepo.update(activeOwnership.ownership.id, ctx.tenantId, {
        status: "transferred",
        endDate: today,
      });
    }

    // 2. Create new active ownership for recipient
    await this.unitOwnershipRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: transfer.condominiumId,
      unitId: transfer.unitId,
      personId: transfer.toPersonId,
      startDate: today,
      status: "active",
      isPrimaryResidence: false,
    });

    // 3. Mark transfer as approved
    return this.transferRepo.update(transferId, ctx.tenantId, {
      status: "approved",
      approvedBy: ctx.userId,
      approvedAt: new Date(),
    });
  }

  async rejectTransfer(transferId: string) {
    const ctx = RequestContextStore.getOrThrow();
    const transfer = await this.transferRepo.findById(transferId, ctx.tenantId);
    if (!transfer) {
      throw new NotFoundException("Solicitud de traspaso no encontrada");
    }
    if (transfer.status !== "pending") {
      throw new BadRequestException(`El traspaso ya se encuentra en estado '${transfer.status}'`);
    }

    return this.transferRepo.update(transferId, ctx.tenantId, {
      status: "rejected",
      approvedBy: ctx.userId,
      approvedAt: new Date(),
    });
  }
}
