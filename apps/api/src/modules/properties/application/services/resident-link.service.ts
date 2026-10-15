import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ResidentLinkRepository } from "../../infrastructure/repositories/resident-link.repository";
import { UnitOwnershipRepository } from "../../infrastructure/repositories/unit-ownership.repository";
import { PersonRepository } from "../../infrastructure/repositories/person.repository";
import { CondominiumsFacade } from "../../../condominiums/condominiums.facade";
import { RequestContextStore } from "../../../../common/context/request-context";
import { CreateResidentLinkRequest, ResolveResidentLinkRequest } from "@sgc/contracts";

@Injectable()
export class ResidentLinkService {
  constructor(
    private readonly residentLinkRepo: ResidentLinkRepository,
    private readonly unitOwnershipRepo: UnitOwnershipRepository,
    private readonly personRepo: PersonRepository,
    private readonly condoFacade: CondominiumsFacade
  ) {}

  async createRequest(dto: CreateResidentLinkRequest) {
    const ctx = RequestContextStore.getOrThrow();

    // 1. Validate condominium exists
    const condo = await this.condoFacade.getCondominiumById(dto.condominiumId, ctx.tenantId);
    if (!condo) {
      throw new NotFoundException("Condominio no encontrado");
    }

    // 2. Validate unit exists in this condominium
    const unit = await this.condoFacade.getUnitByCode(
      dto.unitCode.trim(),
      dto.condominiumId,
      ctx.tenantId
    );
    if (!unit) {
      throw new NotFoundException(
        `No se encontró ninguna unidad con el código '${dto.unitCode}' en este condominio`
      );
    }

    // 3. Check if user already has a pending request for this condominium and unit
    const existingRequests = await this.residentLinkRepo.listRequests(
      dto.condominiumId,
      ctx.tenantId,
      "pending"
    );
    const userPending = existingRequests.find(
      (r) => r.userId === ctx.userId && r.unitCode.toUpperCase() === dto.unitCode.trim().toUpperCase()
    );
    if (userPending) {
      throw new ConflictException("Ya tienes una solicitud pendiente para esta unidad");
    }

    return this.residentLinkRepo.createRequest({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      condominiumId: dto.condominiumId,
      unitCode: dto.unitCode.trim(),
    });
  }

  async listRequests(condominiumId?: string, status?: string) {
    const ctx = RequestContextStore.getOrThrow();
    const isResidentOnly =
      ctx.roles?.includes("resident") &&
      !ctx.roles?.includes("tenant_admin") &&
      !ctx.roles?.includes("condo_admin") &&
      !ctx.isSuperAdmin;

    return this.residentLinkRepo.listRequests(
      condominiumId,
      ctx.tenantId,
      status,
      isResidentOnly ? ctx.userId : undefined
    );
  }

  async approveRequest(requestId: string) {
    const ctx = RequestContextStore.getOrThrow();
    const req = await this.residentLinkRepo.findRequestById(requestId, ctx.tenantId);
    if (!req) {
      throw new NotFoundException("Solicitud de vinculación no encontrada");
    }
    if (req.status !== "pending") {
      throw new BadRequestException(`La solicitud ya se encuentra en estado '${req.status}'`);
    }

    // 1. Locate the unit
    const unit = await this.condoFacade.getUnitByCode(
      req.unitCode,
      req.condominiumId,
      ctx.tenantId
    );
    if (!unit) {
      throw new NotFoundException(`La unidad '${req.unitCode}' no existe en este condominio`);
    }

    // 2. Check if unit is already occupied by an active owner (BR-031 / acceptance criteria)
    const existingActive = await this.unitOwnershipRepo.findActiveForUnit(unit.id, ctx.tenantId);

    // 3. Find or create person profile for the user
    let profile = await this.residentLinkRepo.findProfile(req.userId, ctx.tenantId);
    let personId: string;

    if (profile) {
      personId = profile.personId;
    } else {
      // Find person by email or create new person
      const existingPerson = req.user.email
        ? await this.personRepo.findByEmail(req.user.email, ctx.tenantId)
        : null;

      if (existingPerson) {
        personId = existingPerson.id;
      } else {
        const newPerson = await this.personRepo.create(ctx.tenantId, {
          documentType: "V",
          documentNumber: `REQ-${req.userId.slice(0, 8)}`,
          fullName: req.user.fullName,
          email: req.user.email,
          phone: req.user.phone || undefined,
        });
        personId = newPerson.id;
      }

      await this.residentLinkRepo.createProfile(req.userId, personId, ctx.tenantId);
    }

    // If unit had an active owner and it's a new owner, mark previous as inactive
    if (existingActive) {
      if (existingActive.ownership.personId !== personId) {
        await this.unitOwnershipRepo.update(existingActive.ownership.id, ctx.tenantId, {
          status: "inactive",
          endDate: new Date().toISOString().split("T")[0],
        });
      }
    }

    // 4. Create active unit ownership
    await this.unitOwnershipRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: req.condominiumId,
      unitId: unit.id,
      personId,
      startDate: new Date().toISOString().split("T")[0],
      isPrimaryResidence: true,
      status: "active",
    });

    // 5. Update request status to approved
    return this.residentLinkRepo.updateRequest(requestId, ctx.tenantId, {
      status: "approved",
      resolvedBy: ctx.userId,
      resolvedAt: new Date(),
    });
  }

  async rejectRequest(requestId: string, dto?: ResolveResidentLinkRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const req = await this.residentLinkRepo.findRequestById(requestId, ctx.tenantId);
    if (!req) {
      throw new NotFoundException("Solicitud de vinculación no encontrada");
    }
    if (req.status !== "pending") {
      throw new BadRequestException(`La solicitud ya se encuentra en estado '${req.status}'`);
    }

    return this.residentLinkRepo.updateRequest(requestId, ctx.tenantId, {
      status: "rejected",
      rejectionReason: dto?.rejectionReason || null,
      resolvedBy: ctx.userId,
      resolvedAt: new Date(),
    });
  }

  async getMyProperties() {
    const ctx = RequestContextStore.getOrThrow();
    return this.unitOwnershipRepo.listForUser(ctx.userId, ctx.tenantId);
  }
}
