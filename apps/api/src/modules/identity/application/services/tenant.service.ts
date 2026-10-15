import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { TenantRepository } from "../../infrastructure/repositories/tenant.repository";
import { CreateTenantRequest, UpdateTenantRequest } from "@sgc/contracts";
import * as crypto from "crypto";

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepo: TenantRepository) {}

  async listTenants() {
    return this.tenantRepo.findAll();
  }

  async getTenant(id: string) {
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant) {
      throw new NotFoundException("Tenant no encontrado");
    }
    return tenant;
  }

  async generateUniqueTenantSlug(name: string): Promise<string> {
    const baseSlug =
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 24) || "tenant";

    for (let attempts = 0; attempts < 10; attempts++) {
      const code = crypto.randomBytes(3).toString("hex").toLowerCase();
      const candidate = `${baseSlug}-${code}`;
      const existing = await this.tenantRepo.findBySlug(candidate);
      if (!existing) {
        return candidate;
      }
    }
    return `${baseSlug}-${Date.now()}`;
  }

  async createTenant(dto: CreateTenantRequest) {
    let slug = dto.slug;
    if (!slug || slug.trim().length === 0) {
      slug = await this.generateUniqueTenantSlug(dto.name);
    } else {
      const existing = await this.tenantRepo.findBySlug(slug);
      if (existing) {
        throw new BadRequestException(`El slug '${slug}' ya se encuentra en uso`);
      }
    }

    return this.tenantRepo.create({
      ...dto,
      slug,
    });
  }

  async updateTenant(id: string, dto: UpdateTenantRequest) {
    const tenant = await this.getTenant(id);
    return this.tenantRepo.update(tenant.id, dto);
  }
}
