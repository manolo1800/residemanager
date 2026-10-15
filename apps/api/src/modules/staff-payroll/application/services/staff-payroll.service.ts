import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { StaffRepository } from "../../infrastructure/repositories/staff.repository";
import { ContractTemplateRepository } from "../../infrastructure/repositories/contract-template.repository";
import { StaffContractRepository } from "../../infrastructure/repositories/staff-contract.repository";
import { StaffAttendanceRepository } from "../../infrastructure/repositories/staff-attendance.repository";
import { PayrollPeriodRepository } from "../../infrastructure/repositories/payroll-period.repository";
import { PayrollItemRepository } from "../../infrastructure/repositories/payroll-item.repository";
import { StaffAdvanceRepository } from "../../infrastructure/repositories/staff-advance.repository";
import { CondominiumsFacade } from "../../../condominiums/condominiums.facade";
import { RequestContextStore } from "../../../../common/context/request-context";
import { DatabaseService } from "../../../../common/database/database.service";
import { persons } from "@sgc/database";
import { and, eq, isNull } from "drizzle-orm";
import {
  CreateStaffRequest,
  UpdateStaffRequest,
  CreateContractTemplateRequest,
  UpdateContractTemplateRequest,
  GenerateStaffContractRequest,
  CreateAttendanceRequest,
  UpdateAttendanceRequest,
  CreatePayrollPeriodRequest,
  CreateStaffAdvanceRequest,
  ApproveStaffAdvanceRequest,
} from "@sgc/contracts";

@Injectable()
export class StaffPayrollService {
  constructor(
    private readonly staffRepo: StaffRepository,
    private readonly templateRepo: ContractTemplateRepository,
    private readonly contractRepo: StaffContractRepository,
    private readonly attendanceRepo: StaffAttendanceRepository,
    private readonly periodRepo: PayrollPeriodRepository,
    private readonly itemRepo: PayrollItemRepository,
    private readonly advanceRepo: StaffAdvanceRepository,
    private readonly condoFacade: CondominiumsFacade,
    private readonly dbService: DatabaseService
  ) {}

  // ==========================================
  // 1. PERSONAL (STAFF)
  // ==========================================
  async listStaff(condominiumId: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.staffRepo.listByCondominium(condominiumId, ctx.tenantId);
  }

  async getStaff(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const worker = await this.staffRepo.findById(id, ctx.tenantId);
    if (!worker) throw new NotFoundException("Trabajador no encontrado");
    return worker;
  }

  async createStaff(dto: CreateStaffRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.condoFacade.getCondominiumById(dto.condominiumId, ctx.tenantId);
    if (!condo) throw new NotFoundException("Condominio no encontrado");

    let personId = dto.personId;

    // Si viene información de persona inline y no hay personId
    if (!personId && dto.person) {
      // Buscar si ya existe la persona por documento
      const [existingPerson] = await this.dbService.db
        .select()
        .from(persons)
        .where(
          and(
            eq(persons.tenantId, ctx.tenantId),
            eq(persons.documentType, dto.person.documentType),
            eq(persons.documentNumber, dto.person.documentNumber),
            isNull(persons.deletedAt)
          )
        );

      if (existingPerson) {
        personId = existingPerson.id;
      } else {
        const [newPerson] = await this.dbService.db
          .insert(persons)
          .values({
            tenantId: ctx.tenantId,
            documentType: dto.person.documentType,
            documentNumber: dto.person.documentNumber,
            fullName: dto.person.fullName,
            email: dto.person.email || null,
            phone: dto.person.phone || null,
          })
          .returning();
        personId = newPerson.id;
      }
    }

    if (!personId) {
      throw new BadRequestException("Debe indicar una persona existente o los datos del trabajador");
    }

    const created = await this.staffRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: dto.condominiumId,
      personId,
      position: dto.position,
      contractType: dto.contractType,
      hireDate: dto.hireDate,
      salary: dto.salary,
      salaryCurrency: dto.salaryCurrency,
      payFrequency: dto.payFrequency,
      bankName: dto.bankName || null,
      bankAccount: dto.bankAccount || null,
      documentUrl: dto.documentUrl || null,
      status: dto.status,
      notes: dto.notes || null,
      createdBy: ctx.userId,
    });

    return this.getStaff(created.id);
  }

  async updateStaff(id: string, dto: UpdateStaffRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.staffRepo.findById(id, ctx.tenantId);
    if (!existing) throw new NotFoundException("Trabajador no encontrado");

    const updated = await this.staffRepo.update(id, ctx.tenantId, {
      ...dto,
      updatedBy: ctx.userId,
    });

    return this.getStaff(id);
  }

  async deactivateStaff(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.staffRepo.findById(id, ctx.tenantId);
    if (!existing) throw new NotFoundException("Trabajador no encontrado");

    return this.staffRepo.softDelete(id, ctx.tenantId);
  }

  // ==========================================
  // 2. PLANTILLAS Y CONTRATOS
  // ==========================================
  async listTemplates() {
    const ctx = RequestContextStore.getOrThrow();
    return this.templateRepo.list(ctx.tenantId);
  }

  async createTemplate(dto: CreateContractTemplateRequest) {
    const ctx = RequestContextStore.getOrThrow();
    return this.templateRepo.create({
      tenantId: ctx.tenantId,
      name: dto.name,
      contractType: dto.contractType,
      body: dto.body,
    });
  }

  async updateTemplate(id: string, dto: UpdateContractTemplateRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.templateRepo.findById(id, ctx.tenantId);
    if (!existing) throw new NotFoundException("Plantilla no encontrada");

    return this.templateRepo.update(id, ctx.tenantId, dto);
  }

  async listStaffContracts(staffId: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.contractRepo.listByStaff(staffId, ctx.tenantId);
  }

  async generateContract(dto: GenerateStaffContractRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const worker = await this.staffRepo.findById(dto.staffId, ctx.tenantId);
    if (!worker) throw new NotFoundException("Trabajador no encontrado");

    const condo = await this.condoFacade.getCondominiumById(worker.condominiumId, ctx.tenantId);
    if (!condo) throw new NotFoundException("Condominio no encontrado");

    let template = null;
    if (dto.templateId) {
      template = await this.templateRepo.findById(dto.templateId, ctx.tenantId);
    }
    if (!template) {
      template = await this.templateRepo.findByType(worker.contractType, ctx.tenantId);
    }
    if (!template) {
      throw new BadRequestException(
        `No se encontró una plantilla de contrato para el tipo '${worker.contractType}'. Por favor cree una plantilla primero.`
      );
    }

    // Reemplazo dinámico de variables
    const identification = `${worker.personDocType}-${worker.personDocNumber}`;
    const generatedBody = template.body
      .replace(/\{\{condo_name\}\}/g, condo.name)
      .replace(/\{\{worker_name\}\}/g, worker.personName)
      .replace(/\{\{identification\}\}/g, identification)
      .replace(/\{\{position\}\}/g, worker.position)
      .replace(/\{\{salary\}\}/g, String(worker.salary))
      .replace(/\{\{currency\}\}/g, worker.salaryCurrency)
      .replace(/\{\{frequency\}\}/g, worker.payFrequency)
      .replace(/\{\{hire_date\}\}/g, worker.hireDate);

    // URL representativa del PDF generado
    const pdfUrl = `https://minio.residmanager.local/contracts/contrato_${worker.id}_${Date.now()}.pdf`;

    return this.contractRepo.create({
      tenantId: ctx.tenantId,
      staffId: worker.id,
      templateId: template.id,
      generatedPdfUrl: pdfUrl,
      validFrom: dto.validFrom,
      validTo: dto.validTo || null,
      status: "active",
      signedAt: new Date(),
    });
  }

  // ==========================================
  // 3. ASISTENCIA
  // ==========================================
  async listAttendanceByDate(condominiumId: string, date: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.attendanceRepo.listByCondominiumAndDate(condominiumId, date, ctx.tenantId);
  }

  async listStaffAttendance(staffId: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.attendanceRepo.listByStaff(staffId, ctx.tenantId);
  }

  async recordAttendance(dto: CreateAttendanceRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const worker = await this.staffRepo.findById(dto.staffId, ctx.tenantId);
    if (!worker) throw new NotFoundException("Trabajador no encontrado");

    // Verificar si ya existe registro para este día
    const existing = await this.attendanceRepo.findByStaffAndDate(dto.staffId, dto.date, ctx.tenantId);
    if (existing) {
      // Actualizar registro existente
      return this.attendanceRepo.update(existing.id, ctx.tenantId, {
        status: dto.status,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : existing.checkIn,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : existing.checkOut,
        notes: dto.notes ?? existing.notes,
      });
    }

    return this.attendanceRepo.create({
      tenantId: ctx.tenantId,
      staffId: dto.staffId,
      date: dto.date,
      status: dto.status,
      checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
      checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
      notes: dto.notes || null,
    });
  }

  async updateAttendance(id: string, dto: UpdateAttendanceRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const existing = await this.attendanceRepo.findById(id, ctx.tenantId);
    if (!existing) throw new NotFoundException("Registro de asistencia no encontrado");

    return this.attendanceRepo.update(id, ctx.tenantId, {
      status: dto.status ?? existing.status,
      checkIn: dto.checkIn ? new Date(dto.checkIn) : existing.checkIn,
      checkOut: dto.checkOut ? new Date(dto.checkOut) : existing.checkOut,
      notes: dto.notes ?? existing.notes,
    });
  }

  // ==========================================
  // 4. NÓMINA (PAYROLL PERIODS & ITEMS)
  // ==========================================
  async listPayrollPeriods(condominiumId: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.periodRepo.listByCondominium(condominiumId, ctx.tenantId);
  }

  async getPayrollPeriod(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const period = await this.periodRepo.findById(id, ctx.tenantId);
    if (!period) throw new NotFoundException("Período de nómina no encontrado");
    return period;
  }

  async listPayrollItems(periodId: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.itemRepo.listByPeriod(periodId, ctx.tenantId);
  }

  async getPayrollItem(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const item = await this.itemRepo.findById(id, ctx.tenantId);
    if (!item) throw new NotFoundException("Ítem de nómina no encontrado");
    return item;
  }

  async createPayrollPeriod(dto: CreatePayrollPeriodRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const condo = await this.condoFacade.getCondominiumById(dto.condominiumId, ctx.tenantId);
    if (!condo) throw new NotFoundException("Condominio no encontrado");

    // Crear el período en borrador
    const period = await this.periodRepo.create({
      tenantId: ctx.tenantId,
      condominiumId: dto.condominiumId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: "draft",
      totalAmount: "0.00",
    });

    // Calcular ítems de nómina automáticamente para todos los trabajadores activos
    const staffList = await this.staffRepo.listByCondominium(dto.condominiumId, ctx.tenantId);
    const activeStaff = staffList.filter((s) => s.status === "active");

    let sumTotal = 0;

    for (const worker of activeStaff) {
      const fullSalary = Number(worker.salary) || 0;
      let baseSalary = fullSalary;

      // Cálculo según periodicidad
      if (worker.payFrequency === "biweekly") {
        baseSalary = Number((fullSalary / 2).toFixed(2));
      } else if (worker.payFrequency === "weekly") {
        baseSalary = Number((fullSalary / 4).toFixed(2));
      }

      // Descuento programado de adelantos activos
      let advancesDiscount = 0;
      const activeAdvances = await this.advanceRepo.listActiveApprovedByStaff(worker.id, ctx.tenantId);
      for (const adv of activeAdvances) {
        const rem = Number(adv.remaining) || 0;
        if (rem > 0) {
          const installmentVal = Number((Number(adv.amount) / adv.installments).toFixed(2));
          const toDeduct = Math.min(rem, installmentVal);
          advancesDiscount += toDeduct;
        }
      }

      const deductions = 0;
      const netAmount = Math.max(0, Number((baseSalary - deductions - advancesDiscount).toFixed(2)));

      sumTotal += netAmount;

      await this.itemRepo.create({
        tenantId: ctx.tenantId,
        payrollPeriodId: period.id,
        staffId: worker.id,
        baseSalary: String(baseSalary),
        deductions: String(deductions),
        advancesDiscount: String(advancesDiscount),
        netAmount: String(netAmount),
        currency: worker.salaryCurrency,
        receiptPdfUrl: `https://minio.residmanager.local/payroll/recibo_${worker.id}_${period.id}.pdf`,
        status: "pending",
      });
    }

    // Actualizar total consolidado del período
    await this.periodRepo.update(period.id, ctx.tenantId, {
      totalAmount: String(sumTotal.toFixed(2)),
    });

    return this.getPayrollPeriod(period.id);
  }

  async closePayrollPeriod(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const period = await this.periodRepo.findById(id, ctx.tenantId);
    if (!period) throw new NotFoundException("Período de nómina no encontrado");
    if (period.status !== "draft") {
      throw new BadRequestException("Solo se pueden cerrar períodos en estado borrador ('draft')");
    }

    // Descontar efectivamente las cuotas de adelantos en staff_advances
    const items = await this.itemRepo.listByPeriod(id, ctx.tenantId);
    for (const item of items) {
      const advDiscount = Number(item.advancesDiscount) || 0;
      if (advDiscount > 0) {
        const activeAdvances = await this.advanceRepo.listActiveApprovedByStaff(item.staffId, ctx.tenantId);
        let pendingToDeduct = advDiscount;
        for (const adv of activeAdvances) {
          if (pendingToDeduct <= 0) break;
          const rem = Number(adv.remaining) || 0;
          const deduct = Math.min(rem, pendingToDeduct);
          const newRemaining = Math.max(0, Number((rem - deduct).toFixed(2)));
          pendingToDeduct -= deduct;

          await this.advanceRepo.update(adv.id, ctx.tenantId, {
            remaining: String(newRemaining),
            status: newRemaining === 0 ? "applied" : "approved",
          });
        }
      }
    }

    return this.periodRepo.update(id, ctx.tenantId, {
      status: "closed",
    });
  }

  async payPayrollPeriod(id: string) {
    const ctx = RequestContextStore.getOrThrow();
    const period = await this.periodRepo.findById(id, ctx.tenantId);
    if (!period) throw new NotFoundException("Período de nómina no encontrado");

    // Marcar período como pagado
    await this.periodRepo.update(id, ctx.tenantId, {
      status: "paid",
    });

    // Marcar ítems como pagados
    const items = await this.itemRepo.listByPeriod(id, ctx.tenantId);
    for (const item of items) {
      await this.itemRepo.update(item.id, ctx.tenantId, {
        status: "paid",
      });
    }

    return this.getPayrollPeriod(id);
  }

  // ==========================================
  // 5. ADELANTOS DE SUELDO (ADVANCES)
  // ==========================================
  async listAdvances(condominiumId: string) {
    const ctx = RequestContextStore.getOrThrow();
    return this.advanceRepo.listByCondominium(condominiumId, ctx.tenantId);
  }

  async createAdvance(dto: CreateStaffAdvanceRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const worker = await this.staffRepo.findById(dto.staffId, ctx.tenantId);
    if (!worker) throw new NotFoundException("Trabajador no encontrado");

    return this.advanceRepo.create({
      tenantId: ctx.tenantId,
      staffId: dto.staffId,
      amount: dto.amount,
      currency: dto.currency || worker.salaryCurrency,
      reason: dto.reason || null,
      installments: dto.installments,
      remaining: dto.amount,
      status: "pending",
    });
  }

  async approveAdvance(id: string, dto: ApproveStaffAdvanceRequest) {
    const ctx = RequestContextStore.getOrThrow();
    const advance = await this.advanceRepo.findById(id, ctx.tenantId);
    if (!advance) throw new NotFoundException("Adelanto no encontrado");

    return this.advanceRepo.update(id, ctx.tenantId, {
      status: dto.status,
      approvedBy: dto.status === "approved" ? ctx.userId : null,
    });
  }
}
