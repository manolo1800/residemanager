import { z } from "zod";

export const expenseStatusEnum = z.enum(["pending", "paid", "rejected"]);
export const invoiceStatusEnum = z.enum(["pending", "partially_paid", "paid", "overdue"]);

// ==========================================
// 1. Categorías de Gasto
// ==========================================
export const createExpenseCategorySchema = z.object({
  condominiumId: z.string().uuid(),
  name: z.string().min(1, "El nombre de la categoría es requerido"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isSystem: z.boolean().optional().default(false),
});

export const updateExpenseCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export type CreateExpenseCategoryRequest = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryRequest = z.infer<typeof updateExpenseCategorySchema>;

// ==========================================
// 2. Gastos Operativos Directos
// ==========================================
export const createExpenseSchema = z.object({
  condominiumId: z.string().uuid(),
  categoryId: z.string().uuid("Debe seleccionar una categoría de gasto válida"),
  supplierId: z.string().uuid().optional().nullable(),
  concept: z.string().min(1, "El concepto o motivo del gasto es requerido"),
  description: z.string().optional().nullable(),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  currency: z.string().min(1).default("USD"),
  exchangeRate: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().nullable(),
  amountBaseCurrency: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().nullable(),
  expenseDate: z.string().min(10, "Fecha del gasto requerida (YYYY-MM-DD)"),
  receiptUrl: z.string().optional().nullable(),
  status: expenseStatusEnum.default("paid"),
  isBankCommission: z.boolean().optional().default(false),
  sourceBankMovementId: z.string().uuid().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
});

export const updateExpenseSchema = z.object({
  categoryId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional().nullable(),
  concept: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)).optional(),
  currency: z.string().min(1).optional(),
  exchangeRate: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().nullable(),
  amountBaseCurrency: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().nullable(),
  expenseDate: z.string().optional(),
  receiptUrl: z.string().optional().nullable(),
  status: expenseStatusEnum.optional(),
  paymentMethod: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
});

export const expenseFilterSchema = z.object({
  condominiumId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  status: expenseStatusEnum.optional(),
  supplierId: z.string().uuid().optional(),
  isBankCommission: z.boolean().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export type CreateExpenseRequest = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseRequest = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilterQuery = z.infer<typeof expenseFilterSchema>;

// ==========================================
// 3. Presupuesto Mensual por Categoría
// ==========================================
export const createBudgetSchema = z.object({
  condominiumId: z.string().uuid(),
  categoryId: z.string().uuid("Debe seleccionar una categoría"),
  period: z.string().regex(/^\d{4}-\d{2}$/, "El período debe tener formato AAAA-MM (ej: 2026-10)"),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  currency: z.string().min(1).default("USD"),
  alertThresholdPct: z.union([z.string(), z.number()]).transform((v) => String(v)).default("80.00"),
  notes: z.string().optional().nullable(),
});

export const updateBudgetSchema = z.object({
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)).optional(),
  currency: z.string().min(1).optional(),
  alertThresholdPct: z.union([z.string(), z.number()]).transform((v) => String(v)).optional(),
  notes: z.string().optional().nullable(),
});

export const budgetFilterSchema = z.object({
  condominiumId: z.string().uuid(),
  period: z.string().optional(),
});

export type CreateBudgetRequest = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetRequest = z.infer<typeof updateBudgetSchema>;
export type BudgetFilterQuery = z.infer<typeof budgetFilterSchema>;

// ==========================================
// 4. Proveedores
// ==========================================
export const createSupplierSchema = z.object({
  condominiumId: z.string().uuid(),
  name: z.string().min(1, "El nombre o razón social del proveedor es requerido"),
  taxId: z.string().optional().nullable(), // RIF, CIF, NIT, RFC
  contact: z.string().optional().nullable(),
  email: z.string().email("Correo electrónico no válido").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  creditDays: z.number().int().min(0).default(0),
  category: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  taxId: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  creditDays: z.number().int().min(0).optional(),
  category: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const supplierFilterSchema = z.object({
  condominiumId: z.string().uuid(),
  search: z.string().optional(),
});

export type CreateSupplierRequest = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierRequest = z.infer<typeof updateSupplierSchema>;
export type SupplierFilterQuery = z.infer<typeof supplierFilterSchema>;

// ==========================================
// 5. Facturas de Proveedores (Cuentas por Pagar)
// ==========================================
export const createSupplierInvoiceSchema = z.object({
  condominiumId: z.string().uuid(),
  supplierId: z.string().uuid("Debe seleccionar un proveedor"),
  categoryId: z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().min(1, "El número de factura o comprobante es requerido"),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  currency: z.string().min(1).default("USD"),
  issueDate: z.string().min(10, "Fecha de emisión requerida (YYYY-MM-DD)"),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
});

export const supplierInvoiceFilterSchema = z.object({
  condominiumId: z.string().uuid(),
  supplierId: z.string().uuid().optional(),
  status: invoiceStatusEnum.optional(),
});

export type CreateSupplierInvoiceRequest = z.infer<typeof createSupplierInvoiceSchema>;
export type SupplierInvoiceFilterQuery = z.infer<typeof supplierInvoiceFilterSchema>;

// ==========================================
// 6. Pagos a Proveedores
// ==========================================
export const createSupplierPaymentSchema = z.object({
  condominiumId: z.string().uuid(),
  supplierInvoiceId: z.string().uuid("ID de factura de proveedor requerido"),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  currency: z.string().min(1).default("USD"),
  paymentDate: z.string().min(10, "Fecha del pago requerida (YYYY-MM-DD)"),
  method: z.string().default("transfer"),
  reference: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateSupplierPaymentRequest = z.infer<typeof createSupplierPaymentSchema>;
