import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { FeePlanRepository } from "../../infrastructure/repositories/fee-plan.repository";
import { UnitChargeRepository } from "../../infrastructure/repositories/unit-charge.repository";
import { MoraRuleRepository } from "../../infrastructure/repositories/mora-rule.repository";
import { CurrencyRateRepository } from "../../infrastructure/repositories/currency-rate.repository";
import { CondominiumsFacade } from "../../../condominiums/condominiums.facade";
import { PropertiesFacade } from "../../../properties/properties.facade";
import { RequestContextStore } from "../../../../common/context/request-context";
import {
  CreateFeePlanRequest,
  UpdateFeePlanRequest,
  GenerateUnitChargesRequest,
  CreateMoraRuleRequest,
  CreateCurrencyRateRequest,
} from "@sgc/contracts";

@Injectable()
export class BillingService {
  constructor(
    private readonly feePlanRepo: FeePlanRepository,
    private readonly unitChargeRepo: UnitChargeRepository,
    private readonly moraRuleRepo: MoraRuleRepository,
    private readonly currencyRateRepo: CurrencyRateRepository,
    private readonly condoFacade: CondominiumsFacade,
    private readonly propertiesFacade: PropertiesFacade
  ) {}

  // 1. Fee Plans
  async createFeePlan(dto: CreateFeePlanRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.condoFacade.getCondominiumById(dto.condominiumId, ctx.tenantId);
    if (!condo) {
      throw new NotFoundException("Condominio no encontrado");
    }

    // BR-003: Cuota extraordinaria
    if (dto.type === "extraordinary") {
      if (condo.extraordinaryRequiresMeeting && !dto.requiresMeeting && !dto.minuteId) {
        throw new BadRequestException(
          "El condominio exige acta o asamblea aprobatoria para cuotas extraordinarias"
        );
      }
    }

    // BR-002: Alcance de cuota
    if (dto.appliesTo === "structure" && !dto.structureId) {
      throw new BadRequestException("Debe especificar la estructura a la que aplica la cuota");
    }
    if (dto.appliesTo === "unit" && !dto.unitId) {
      throw new BadRequestException("Debe especificar la unidad a la que aplica la cuota");
    }

    return this.feePlanRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: dto.condominiumId,
      name: dto.name,
      type: dto.type,
      mode: dto.mode || "fixed",
      amount: String(dto.amount),
      currency: dto.currency || condo.baseCurrency || "USD",
      appliesTo: dto.appliesTo || "all",
      structureId: dto.structureId || null,
      unitId: dto.unitId || null,
      taxApplies: dto.taxApplies !== false,
      startDate: dto.startDate,
      endDate: dto.endDate || null,
      requiresMeeting: Boolean(dto.requiresMeeting),
      minuteId: dto.minuteId || null,
      status: "active",
      createdBy: ctx.userId,
    });
  }

  async updateFeePlan(id: string, dto: UpdateFeePlanRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.feePlanRepo.findById(id, ctx.tenantId);
    if (!existing) {
      throw new NotFoundException("Plan de cuota no encontrado");
    }

    const updateData: any = {
      updatedBy: ctx.userId,
    };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.mode !== undefined) updateData.mode = dto.mode;
    if (dto.amount !== undefined) updateData.amount = String(dto.amount);
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.appliesTo !== undefined) updateData.appliesTo = dto.appliesTo;
    if (dto.structureId !== undefined) updateData.structureId = dto.structureId;
    if (dto.unitId !== undefined) updateData.unitId = dto.unitId;
    if (dto.taxApplies !== undefined) updateData.taxApplies = dto.taxApplies;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate;
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate;
    if (dto.requiresMeeting !== undefined) updateData.requiresMeeting = dto.requiresMeeting;
    if (dto.minuteId !== undefined) updateData.minuteId = dto.minuteId;
    if (dto.status !== undefined) updateData.status = dto.status;

    return this.feePlanRepo.update(id, ctx.tenantId, updateData);
  }

  async cancelFeePlan(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.feePlanRepo.findById(id, ctx.tenantId);
    if (!existing) {
      throw new NotFoundException("Plan de cuota no encontrado");
    }
    return this.feePlanRepo.update(id, ctx.tenantId, {
      status: "cancelled",
      updatedBy: ctx.userId,
    });
  }

  async listFeePlans(condominiumId: string, filters?: { type?: string; status?: string }) {
    const ctx = RequestContextStore.getOrThrow();
    return this.feePlanRepo.listByCondominium(condominiumId, ctx.tenantId, filters);
  }

  // 2. Unit Charges Generation & Mora
  async generateMonthlyCharges(dto: GenerateUnitChargesRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.condoFacade.getCondominiumById(dto.condominiumId, ctx.tenantId);
    if (!condo) {
      throw new NotFoundException("Condominio no encontrado");
    }

    // Units
    const unitsList = await this.condoFacade.getUnitsByCondominium(dto.condominiumId, ctx.tenantId);
    if (!unitsList || unitsList.length === 0) {
      throw new BadRequestException("No hay unidades registradas en el condominio para generar cargos");
    }

    // Active plans for period
    const periodDate = `${dto.period}-01`;
    const activePlans = await this.feePlanRepo.findActivePlansForCondominium(
      dto.condominiumId,
      ctx.tenantId,
      periodDate
    );

    if (activePlans.length === 0) {
      throw new BadRequestException(`No hay planes de cuota activos para el período ${dto.period}`);
    }

    const dueDate = dto.dueDate || `${dto.period}-15`;
    const taxRate = Number(condo.taxRate || 0);
    const taxIncluded = Boolean(condo.taxIncludedInFee);
    const taxExempt = Boolean(condo.taxExempt);

    let generatedCount = 0;
    let skippedCount = 0;

    for (const unit of unitsList) {
      for (const plan of activePlans) {
        // Scope filter (BR-002)
        if (plan.appliesTo === "structure" && plan.structureId !== unit.structureId) {
          continue;
        }
        if (plan.appliesTo === "unit" && plan.unitId !== unit.id) {
          continue;
        }

        // Check if charge already exists (Idempotency)
        const existing = await this.unitChargeRepo.findByUnitPlanAndPeriod(
          unit.id,
          plan.id,
          dto.period,
          ctx.tenantId
        );
        if (existing) {
          skippedCount++;
          continue;
        }

        // Calculate tax and total (BR-004)
        const baseAmount = Number(plan.amount);
        const shouldApplyTax = plan.taxApplies && !taxExempt && taxRate > 0;

        let amountBaseStr = baseAmount.toFixed(2);
        let taxAmountStr = "0.00";
        let totalAmountStr = baseAmount.toFixed(2);

        if (shouldApplyTax) {
          if (taxIncluded) {
            const factor = 1 + taxRate / 100;
            const netBase = baseAmount / factor;
            amountBaseStr = netBase.toFixed(2);
            taxAmountStr = (baseAmount - netBase).toFixed(2);
            totalAmountStr = baseAmount.toFixed(2);
          } else {
            const taxVal = baseAmount * (taxRate / 100);
            amountBaseStr = baseAmount.toFixed(2);
            taxAmountStr = taxVal.toFixed(2);
            totalAmountStr = (baseAmount + taxVal).toFixed(2);
          }
        }

        await this.unitChargeRepo.create({
          tenantId: ctx.tenantId,
          condominiumId: dto.condominiumId,
          unitId: unit.id,
          feePlanId: plan.id,
          period: dto.period,
          amountBase: amountBaseStr,
          taxAmount: taxAmountStr,
          moraAmount: "0.00",
          totalAmount: totalAmountStr,
          paidAmount: "0.00",
          currency: plan.currency || condo.baseCurrency || "USD",
          status: "pending",
          dueDate: dueDate,
        });

        generatedCount++;
      }
    }

    // Automatically check and apply mora to overdue charges
    await this.applyMora(dto.condominiumId);

    return {
      condominiumId: dto.condominiumId,
      period: dto.period,
      generatedCount,
      skippedCount,
      totalUnits: unitsList.length,
      dueDate,
    };
  }

  // BR-006 & BR-009: Mora Engine
  async applyMora(condominiumId: string) {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.condoFacade.getCondominiumById(condominiumId, ctx.tenantId);
    if (!condo) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const overdueCharges = await this.unitChargeRepo.findPendingOverdue(
      condominiumId,
      ctx.tenantId,
      todayStr
    );

    if (overdueCharges.length === 0) return;

    // Check specific mora rule or condo defaults
    const moraRule = await this.moraRuleRepo.findByCondominium(condominiumId, ctx.tenantId);
    const moraType = moraRule?.type || condo.moraType || "percentage";
    const moraVal = Number(moraRule?.value ?? condo.moraValue ?? 0);

    for (const charge of overdueCharges) {
      if (moraVal <= 0) {
        await this.unitChargeRepo.update(charge.id, ctx.tenantId, { status: "overdue" });
        continue;
      }

      let moraAmount = 0;
      if (moraType === "fixed") {
        moraAmount = moraVal;
      } else {
        // Percentage over base only (BR-006: Mora sobre base, no compuesta)
        moraAmount = Number(charge.amountBase) * (moraVal / 100);
      }

      const newTotal =
        Number(charge.amountBase) +
        Number(charge.taxAmount) +
        moraAmount -
        Number(charge.paidAmount);

      await this.unitChargeRepo.update(charge.id, ctx.tenantId, {
        moraAmount: moraAmount.toFixed(2),
        totalAmount: newTotal.toFixed(2),
        status: "overdue",
      });
    }
  }

  async listUnitCharges(
    condominiumId: string,
    filters?: { period?: string; status?: string; unitId?: string }
  ) {
    const ctx = RequestContextStore.getOrThrow();
    return this.unitChargeRepo.listByCondominium(condominiumId, ctx.tenantId, filters);
  }

  // 3. Statement of Account (BR-046)
  async getUnitStatement(unitId: string) {
    const ctx = RequestContextStore.getOrThrow();

    // Check if user is a resident only, verify ownership
    const isResident =
      ctx.roles?.includes("resident") &&
      !ctx.isSuperAdmin &&
      !ctx.roles?.includes("tenant_admin") &&
      !ctx.roles?.includes("condo_admin");

    if (isResident) {
      const userProperties = await this.propertiesFacade.listUserProperties(ctx.userId, ctx.tenantId);
      const isOwner = userProperties.some((p: any) => p.unitId === unitId);
      if (!isOwner) {
        throw new ForbiddenException("No tiene permisos para ver el estado de cuenta de esta unidad");
      }
    }

    const charges = await this.unitChargeRepo.listByUnit(unitId, ctx.tenantId);

    // Calculate totals
    let totalBase = 0;
    let totalTax = 0;
    let totalMora = 0;
    let totalDebt = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    let pendingCount = 0;

    for (const item of charges) {
      const c = item.charge;
      totalBase += Number(c.amountBase || 0);
      totalTax += Number(c.taxAmount || 0);
      totalMora += Number(c.moraAmount || 0);
      totalPaid += Number(c.paidAmount || 0);

      const balance = Number(c.totalAmount || 0) - Number(c.paidAmount || 0);
      if (c.status === "overdue" || c.status === "pending" || c.status === "partially_paid") {
        totalDebt += balance > 0 ? balance : 0;
      }
      if (c.status === "overdue") overdueCount++;
      if (c.status === "pending") pendingCount++;
    }

    const activeOwner = await this.propertiesFacade.getActiveOwnerForUnit(unitId, ctx.tenantId);

    return {
      unitId,
      owner: activeOwner
        ? {
            personId: activeOwner.person.id,
            fullName: activeOwner.person.fullName,
            documentType: activeOwner.person.documentType,
            documentNumber: activeOwner.person.documentNumber,
            email: activeOwner.person.email,
            phone: activeOwner.person.phone,
          }
        : null,
      summary: {
        totalBase: totalBase.toFixed(2),
        totalTax: totalTax.toFixed(2),
        totalMora: totalMora.toFixed(2),
        totalDebt: totalDebt.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        overdueCount,
        pendingCount,
        totalCharges: charges.length,
      },
      charges,
    };
  }

  // 4. Morosity Panel (BR-047)
  async getMorosityPanel(condominiumId: string, structureId?: string) {
    const ctx = RequestContextStore.getOrThrow();
    // Update overdue moras first
    await this.applyMora(condominiumId);

    const data = await this.unitChargeRepo.getMorosityData(condominiumId, ctx.tenantId, structureId);

    // Group by unit
    const unitMap = new Map<string, any>();

    for (const row of data) {
      if (!unitMap.has(row.unitId)) {
        unitMap.set(row.unitId, {
          unitId: row.unitId,
          unitCode: row.unitCode,
          structureId: row.structureId,
          structureName: row.structureName,
          overdueChargesCount: 0,
          totalDebt: 0,
          totalMora: 0,
          currency: row.currency,
          oldestDueDate: row.dueDate,
          charges: [],
        });
      }

      const item = unitMap.get(row.unitId);
      const balance = Number(row.totalAmount) - Number(row.paidAmount);
      item.totalDebt += balance > 0 ? balance : 0;
      item.totalMora += Number(row.moraAmount || 0);
      item.overdueChargesCount++;
      if (row.dueDate < item.oldestDueDate) {
        item.oldestDueDate = row.dueDate;
      }
      item.charges.push(row);
    }

    // Attach owners to debtor units
    const debtors = Array.from(unitMap.values());
    for (const d of debtors) {
      const ownerInfo = await this.propertiesFacade.getActiveOwnerForUnit(d.unitId, ctx.tenantId);
      d.owner = ownerInfo
        ? {
            fullName: ownerInfo.person.fullName,
            phone: ownerInfo.person.phone,
            email: ownerInfo.person.email,
          }
        : null;
      d.totalDebt = d.totalDebt.toFixed(2);
      d.totalMora = d.totalMora.toFixed(2);
    }

    const totalArrears = debtors.reduce((acc, d) => acc + Number(d.totalDebt), 0);
    const totalMoraAll = debtors.reduce((acc, d) => acc + Number(d.totalMora), 0);

    return {
      condominiumId,
      totalDebtorUnits: debtors.length,
      totalArrears: totalArrears.toFixed(2),
      totalMora: totalMoraAll.toFixed(2),
      debtors,
    };
  }

  // 5. Mora Rules & Currency Rates
  async createMoraRule(dto: CreateMoraRuleRequest) {
    const ctx = RequestContextStore.getOrThrow();
    return this.moraRuleRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: dto.condominiumId,
      type: dto.type,
      value: String(dto.value),
      appliesAfterDays: dto.appliesAfterDays ?? 1,
    });
  }

  async listMoraRules(condominiumId: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.moraRuleRepo.listByCondominium(condominiumId, ctx.tenantId);
  }

  async createCurrencyRate(dto: CreateCurrencyRateRequest) {
    const ctx = RequestContextStore.getOrThrow();
    return this.currencyRateRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: dto.condominiumId,
      fromCurrency: dto.fromCurrency.toUpperCase(),
      toCurrency: dto.toCurrency.toUpperCase(),
      rate: String(dto.rate),
      source: dto.source || "Manual",
      effectiveDate: dto.effectiveDate,
    });
  }

  async listCurrencyRates(condominiumId: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.currencyRateRepo.listByCondominium(condominiumId, ctx.tenantId);
  }
}
