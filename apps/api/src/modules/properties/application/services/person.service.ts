import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PersonRepository } from "../../infrastructure/repositories/person.repository";
import { RequestContextStore } from "../../../../common/context/request-context";
import { CreatePersonRequest, UpdatePersonRequest } from "@sgc/contracts";

@Injectable()
export class PersonService {
  constructor(private readonly personRepo: PersonRepository) {}

  async listPersons(search?: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.personRepo.list(ctx.tenantId, search);
  }

  async getPerson(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const person = await this.personRepo.findById(id, ctx.tenantId);
    if (!person) {
      throw new NotFoundException("Persona no encontrada");
    }
    return person;
  }

  async createPerson(dto: CreatePersonRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.personRepo.findByDocument(
      dto.documentType,
      dto.documentNumber.trim(),
      ctx.tenantId
    );
    if (existing) {
      throw new ConflictException(
        `Ya existe una persona con el documento ${dto.documentType}-${dto.documentNumber.trim()} en esta administradora`
      );
    }

    return this.personRepo.create(ctx.tenantId, dto);
  }

  async updatePerson(id: string, dto: UpdatePersonRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.getPerson(id);

    if (
      dto.documentType &&
      dto.documentNumber &&
      (dto.documentType !== existing.documentType || dto.documentNumber !== existing.documentNumber)
    ) {
      const duplicate = await this.personRepo.findByDocument(
        dto.documentType,
        dto.documentNumber.trim(),
        ctx.tenantId
      );
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Ya existe otra persona con el documento ${dto.documentType}-${dto.documentNumber.trim()}`
        );
      }
    }

    return this.personRepo.update(id, ctx.tenantId, dto);
  }
}
