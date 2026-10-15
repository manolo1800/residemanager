import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UnitRepository, UnitFilters } from "../../infrastructure/repositories/unit.repository";
import { StructureRepository } from "../../infrastructure/repositories/structure.repository";
import { CondominiumRepository } from "../../infrastructure/repositories/condominium.repository";
import { RequestContextStore } from "../../../../common/context/request-context";
import {
  CreateUnitRequest,
  UpdateUnitRequest,
  BulkImportUnitsItem,
  BulkImportResult,
} from "@sgc/contracts";

@Injectable()
export class UnitService {
  constructor(
    private readonly unitRepo: UnitRepository,
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

  async listUnits(condominiumId: string, filters: UnitFilters = {}) {
    const ctx = RequestContextStore.getOrThrow();
    await this.ensureCondoExists(condominiumId, ctx.tenantId);

    const [items, total] = await Promise.all([
      this.unitRepo.findAll(condominiumId, ctx.tenantId, filters),
      this.unitRepo.count(condominiumId, ctx.tenantId, filters),
    ]);

    return {
      items,
      total,
      page: filters.offset && filters.limit ? Math.floor(filters.offset / filters.limit) + 1 : 1,
      limit: filters.limit || items.length,
    };
  }

  async getUnit(condominiumId: string, id: string) {
    const ctx = RequestContextStore.getOrThrow();
    await this.ensureCondoExists(condominiumId, ctx.tenantId);
    const unit = await this.unitRepo.findById(id, condominiumId, ctx.tenantId);
    if (!unit) {
      throw new NotFoundException("Unidad no encontrada");
    }
    return unit;
  }

  async createUnit(condominiumId: string, dto: CreateUnitRequest) {
    const ctx = RequestContextStore.getOrThrow();
    await this.ensureCondoExists(condominiumId, ctx.tenantId);

    const existing = await this.unitRepo.findByCode(dto.code, condominiumId, ctx.tenantId);
    if (existing) {
      throw new BadRequestException(
        `Ya existe una unidad con la nomenclatura/código '${dto.code}' en este condominio`
      );
    }

    if (dto.structureId) {
      const structure = await this.structureRepo.findById(dto.structureId, condominiumId, ctx.tenantId);
      if (!structure) {
        throw new BadRequestException("La estructura especificada no pertenece a este condominio");
      }
    }

    return this.unitRepo.create({
      tenantId: ctx.tenantId,
      condominiumId,
      structureId: dto.structureId || null,
      code: dto.code.trim(),
      floor: dto.floor ?? null,
      type: dto.type,
      areaM2: dto.areaM2 ? String(dto.areaM2) : null,
      aliquotPct: dto.aliquotPct ? String(dto.aliquotPct) : null,
      status: dto.status || "active",
    });
  }

  async updateUnit(condominiumId: string, id: string, dto: UpdateUnitRequest) {
    const ctx = RequestContextStore.getOrThrow();
    await this.getUnit(condominiumId, id);

    if (dto.code) {
      const existing = await this.unitRepo.findByCode(dto.code, condominiumId, ctx.tenantId);
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Ya existe una unidad con el código '${dto.code}'`);
      }
    }

    if (dto.structureId) {
      const structure = await this.structureRepo.findById(dto.structureId, condominiumId, ctx.tenantId);
      if (!structure) {
        throw new BadRequestException("La estructura especificada no pertenece a este condominio");
      }
    }

    return this.unitRepo.update(id, condominiumId, ctx.tenantId, {
      ...(dto.code ? { code: dto.code.trim() } : {}),
      ...(dto.structureId !== undefined ? { structureId: dto.structureId } : {}),
      ...(dto.floor !== undefined ? { floor: dto.floor } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.areaM2 !== undefined ? { areaM2: dto.areaM2 ? String(dto.areaM2) : null } : {}),
      ...(dto.aliquotPct !== undefined ? { aliquotPct: dto.aliquotPct ? String(dto.aliquotPct) : null } : {}),
      ...(dto.status ? { status: dto.status } : {}),
    });
  }

  async deleteUnit(condominiumId: string, id: string) {
    const ctx = RequestContextStore.getOrThrow();
    await this.getUnit(condominiumId, id);
    return this.unitRepo.softDelete(id, condominiumId, ctx.tenantId);
  }

  async importUnits(condominiumId: string, unitsToImport: BulkImportUnitsItem[]): Promise<BulkImportResult> {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.ensureCondoExists(condominiumId, ctx.tenantId);

    const errors: { row: number; code: string; message: string }[] = [];
    const validUnits: any[] = [];
    const existingStructures = await this.structureRepo.findByCondo(condominiumId, ctx.tenantId);
    const structureMap = new Map<string, string>();
    for (const s of existingStructures) {
      structureMap.set(s.name.toLowerCase().trim(), s.id);
    }

    const seenCodesInBatch = new Set<string>();

    for (let i = 0; i < unitsToImport.length; i++) {
      const rowNum = i + 1;
      const item = unitsToImport[i];
      const code = item.code?.trim();

      if (!code) {
        errors.push({ row: rowNum, code: "", message: "El código de unidad es obligatorio" });
        continue;
      }

      if (seenCodesInBatch.has(code.toLowerCase())) {
        errors.push({ row: rowNum, code, message: `Código '${code}' duplicado en el mismo archivo/lote` });
        continue;
      }

      // Check DB existence
      const existingDb = await this.unitRepo.findByCode(code, condominiumId, ctx.tenantId);
      if (existingDb) {
        errors.push({ row: rowNum, code, message: `La unidad '${code}' ya existe en este condominio` });
        continue;
      }

      let structureId: string | null = null;
      if (item.structureName && item.structureName.trim().length > 0) {
        const cleanName = item.structureName.trim();
        const existingId = structureMap.get(cleanName.toLowerCase());
        if (existingId) {
          structureId = existingId;
        } else {
          // Auto-create structure if missing
          const newStruct = await this.structureRepo.create({
            tenantId: ctx.tenantId,
            condominiumId,
            name: cleanName,
            kind: condo.type === "houses" ? "block" : "building",
            floors: item.floor ? Math.max(item.floor, 1) : null,
            position: structureMap.size + 1,
          });
          structureId = newStruct.id;
          structureMap.set(cleanName.toLowerCase(), newStruct.id);
        }
      }

      seenCodesInBatch.add(code.toLowerCase());

      validUnits.push({
        tenantId: ctx.tenantId,
        condominiumId,
        structureId,
        code,
        floor: item.floor ?? null,
        type: item.type || (condo.type === "houses" ? "house" : "apartment"),
        areaM2: item.areaM2 ? String(item.areaM2) : null,
        aliquotPct: item.aliquotPct ? String(item.aliquotPct) : null,
        status: "active",
      });
    }

    let totalCreated = 0;
    if (validUnits.length > 0) {
      const created = await this.unitRepo.createMany(validUnits);
      totalCreated = created.length;
    }

    return {
      totalProcessed: unitsToImport.length,
      totalCreated,
      errors,
    };
  }

  parseCsv(csvContent: string): BulkImportUnitsItem[] {
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) return [];

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const codeIdx = header.findIndex((h) => h === "code" || h === "codigo" || h === "unidad");
    const structIdx = header.findIndex((h) => h === "structure" || h === "estructura" || h === "torre" || h === "bloque");
    const floorIdx = header.findIndex((h) => h === "floor" || h === "piso");
    const typeIdx = header.findIndex((h) => h === "type" || h === "tipo");
    const areaIdx = header.findIndex((h) => h === "area" || h === "aream2" || h === "area_m2" || h === "metros");
    const aliquotIdx = header.findIndex((h) => h === "aliquot" || h === "alicuota" || h === "aliquot_pct");

    const items: BulkImportUnitsItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
      const code = codeIdx >= 0 ? values[codeIdx] : values[0];
      if (!code) continue;

      const rawFloor = floorIdx >= 0 ? parseInt(values[floorIdx], 10) : undefined;
      const rawType = typeIdx >= 0 && ["house", "casa"].includes(values[typeIdx]?.toLowerCase()) ? "house" : "apartment";
      const rawArea = areaIdx >= 0 ? values[areaIdx] : undefined;
      const rawAliquot = aliquotIdx >= 0 ? values[aliquotIdx] : undefined;
      const structureName = structIdx >= 0 ? values[structIdx] : undefined;

      items.push({
        code,
        structureName,
        floor: isNaN(rawFloor as any) ? undefined : rawFloor,
        type: rawType,
        areaM2: rawArea,
        aliquotPct: rawAliquot,
      });
    }

    return items;
  }
}
