import { z } from "zod";

// ==========================================
// Enums
// ==========================================
export const contractTypeEnum = z.enum(["individual", "company", "cooperative"]);
export const payFrequencyEnum = z.enum(["weekly", "biweekly", "monthly"]);
export const staffStatusEnum = z.enum(["active", "inactive", "terminated"]);
export const attendanceStatusEnum = z.enum(["present", "absent", "late", "justified"]);
export const payrollStatusEnum = z.enum(["draft", "closed", "paid"]);
export const advanceStatusEnum = z.enum(["pending", "approved", "applied", "rejected"]);

// ==========================================
// 1. Staff (Personal)
// ==========================================
export const inlinePersonSchema = z.object({
  documentType: z.string().min(1).default("V"),
  documentNumber: z.string().min(1, "Número de documento requerido"),
  fullName: z.string().min(2, "Nombre completo requerido"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
});

export const createStaffSchema = z.object({
  condominiumId: z.string().uuid("Condominio requerido"),
  personId: z.string().uuid().optional().nullable(),
  person: inlinePersonSchema.optional().nullable(),
  position: z.string().min(1, "Cargo o puesto de trabajo requerido"),
  contractType: contractTypeEnum.default("individual"),
  hireDate: z.string().min(10, "Fecha de ingreso requerida (YYYY-MM-DD)"),
  salary: z.union([z.string(), z.number()]).transform((v) => String(v)),
  salaryCurrency: z.string().min(1).default("USD"),
  payFrequency: payFrequencyEnum.default("biweekly"),
  bankName: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
  status: staffStatusEnum.default("active"),
  notes: z.string().optional().nullable(),
});

export const updateStaffSchema = z.object({
  position: z.string().min(1).optional(),
  contractType: contractTypeEnum.optional(),
  hireDate: z.string().optional(),
  salary: z.union([z.string(), z.number()]).transform((v) => String(v)).optional(),
  salaryCurrency: z.string().optional(),
  payFrequency: payFrequencyEnum.optional(),
  bankName: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
  status: staffStatusEnum.optional(),
  notes: z.string().optional().nullable(),
});

export type CreateStaffRequest = z.infer<typeof createStaffSchema>;
export type UpdateStaffRequest = z.infer<typeof updateStaffSchema>;

// ==========================================
// 2. Plantillas de Contrato
// ==========================================
export const createContractTemplateSchema = z.object({
  name: z.string().min(1, "Nombre de la plantilla requerido"),
  contractType: contractTypeEnum,
  body: z.string().min(10, "Cuerpo del contrato requerido"),
});

export const updateContractTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  contractType: contractTypeEnum.optional(),
  body: z.string().min(10).optional(),
});

export type CreateContractTemplateRequest = z.infer<typeof createContractTemplateSchema>;
export type UpdateContractTemplateRequest = z.infer<typeof updateContractTemplateSchema>;

// ==========================================
// 3. Generación de Contratos
// ==========================================
export const generateStaffContractSchema = z.object({
  staffId: z.string().uuid("ID de trabajador requerido"),
  templateId: z.string().uuid().optional().nullable(),
  validFrom: z.string().min(10, "Fecha de inicio de vigencia requerida (YYYY-MM-DD)"),
  validTo: z.string().optional().nullable(),
});

export type GenerateStaffContractRequest = z.infer<typeof generateStaffContractSchema>;

// ==========================================
// 4. Control de Asistencia
// ==========================================
export const createAttendanceSchema = z.object({
  staffId: z.string().uuid("ID de trabajador requerido"),
  date: z.string().min(10, "Fecha de asistencia requerida (YYYY-MM-DD)"),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  status: attendanceStatusEnum.default("present"),
  notes: z.string().optional().nullable(),
});

export const updateAttendanceSchema = z.object({
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  status: attendanceStatusEnum.optional(),
  notes: z.string().optional().nullable(),
});

export type CreateAttendanceRequest = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceRequest = z.infer<typeof updateAttendanceSchema>;

// ==========================================
// 5. Períodos de Nómina y Recibos
// ==========================================
export const createPayrollPeriodSchema = z.object({
  condominiumId: z.string().uuid("Condominio requerido"),
  startDate: z.string().min(10, "Fecha de inicio requerida (YYYY-MM-DD)"),
  endDate: z.string().min(10, "Fecha de fin requerida (YYYY-MM-DD)"),
});

export type CreatePayrollPeriodRequest = z.infer<typeof createPayrollPeriodSchema>;

// ==========================================
// 6. Adelantos de Sueldo
// ==========================================
export const createStaffAdvanceSchema = z.object({
  staffId: z.string().uuid("ID de trabajador requerido"),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  currency: z.string().min(1).default("USD"),
  reason: z.string().optional().nullable(),
  installments: z.number().int().min(1).default(1),
});

export const approveStaffAdvanceSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  notes: z.string().optional().nullable(),
});

export type CreateStaffAdvanceRequest = z.infer<typeof createStaffAdvanceSchema>;
export type ApproveStaffAdvanceRequest = z.infer<typeof approveStaffAdvanceSchema>;
