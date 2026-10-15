"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Filter,
  Plus,
  Search,
  CheckCircle,
  Clock,
  ExternalLink,
  Percent,
  RefreshCw,
  Trash2,
  X,
  Truck,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  PieChart as PieChartIcon,
} from "lucide-react";
import { fetchApi } from "../../../lib/api";

interface ExpensesSuppliersViewProps {
  condoDetails: any;
  currentUser: any;
  notify: (msg: string) => void;
}

export function ExpensesSuppliersView({
  condoDetails,
  currentUser,
  notify,
}: ExpensesSuppliersViewProps) {
  // Navigation tabs inside Expenses module
  const [activeTab, setActiveTab] = useState<
    "expenses" | "budgets" | "suppliers" | "invoices" | "cashflow"
  >("expenses");

  // Selected period (default current month e.g. '2026-10')
  const [period, setPeriod] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7);
  });

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgetsSummary, setBudgetsSummary] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [cashflow, setCashflow] = useState<any>(null);

  // Filters
  const [expenseSearch, setExpenseSearch] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [onlyBankCommissions, setOnlyBankCommissions] = useState<boolean>(false);
  const [supplierSearch, setSupplierSearch] = useState<string>("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("all");

  // Modals state
  const [showCreateExpenseModal, setShowCreateExpenseModal] = useState<boolean>(false);
  const [showCreateBudgetModal, setShowCreateBudgetModal] = useState<boolean>(false);
  const [showCreateSupplierModal, setShowCreateSupplierModal] = useState<boolean>(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState<boolean>(false);
  const [showPayInvoiceModal, setShowPayInvoiceModal] = useState<boolean>(false);
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<any>(null);

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    categoryId: "",
    supplierId: "",
    concept: "",
    description: "",
    amount: "",
    currency: "USD",
    expenseDate: new Date().toISOString().split("T")[0],
    receiptUrl: "",
    paymentMethod: "transfer",
    referenceNumber: "",
    isBankCommission: false,
  });

  const [budgetForm, setBudgetForm] = useState({
    categoryId: "",
    period: period,
    amount: "",
    currency: "USD",
    alertThresholdPct: "80",
    notes: "",
  });

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    taxId: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    creditDays: 0,
    category: "",
    notes: "",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    supplierId: "",
    categoryId: "",
    invoiceNumber: "",
    amount: "",
    currency: "USD",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
    receiptUrl: "",
  });

  const [payInvoiceForm, setPayInvoiceForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    method: "transfer",
    reference: "",
    receiptUrl: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load all module data
  const loadData = async () => {
    if (!condoDetails?.id) return;
    setLoading(true);
    try {
      const [catsRes, expsRes, bgRes, suppsRes, invsRes, cfRes] =
        await Promise.allSettled([
          fetchApi<any[]>(`/expense-categories?condominiumId=${condoDetails.id}`),
          fetchApi<any[]>(`/expenses?condominiumId=${condoDetails.id}`),
          fetchApi<any>(`/budgets/summary?condominiumId=${condoDetails.id}&period=${period}`),
          fetchApi<any[]>(`/suppliers?condominiumId=${condoDetails.id}`),
          fetchApi<any[]>(`/supplier-invoices?condominiumId=${condoDetails.id}`),
          fetchApi<any>(`/cashflow/summary?condominiumId=${condoDetails.id}&period=${period}`),
        ]);

      if (catsRes.status === "fulfilled") setCategories(catsRes.value || []);
      if (expsRes.status === "fulfilled") setExpenses(expsRes.value || []);
      if (bgRes.status === "fulfilled") setBudgetsSummary(bgRes.value || null);
      if (suppsRes.status === "fulfilled") setSuppliers(suppsRes.value || []);
      if (invsRes.status === "fulfilled") setInvoices(invsRes.value || []);
      if (cfRes.status === "fulfilled") setCashflow(cfRes.value || null);
    } catch (err: any) {
      console.error("Error loading expenses data:", err);
      notify("Error cargando los datos de gastos y proveedores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [condoDetails?.id, period]);

  // Handle Create Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.concept || !expenseForm.amount || !expenseForm.categoryId) {
      notify("Complete los campos obligatorios del gasto.");
      return;
    }
    setIsSubmitting(true);
    try {
      await fetchApi("/expenses", {
        method: "POST",
        body: JSON.stringify({
          condominiumId: condoDetails.id,
          categoryId: expenseForm.categoryId,
          supplierId: expenseForm.supplierId || null,
          concept: expenseForm.concept,
          description: expenseForm.description || null,
          amount: expenseForm.amount,
          currency: expenseForm.currency,
          expenseDate: expenseForm.expenseDate,
          receiptUrl: expenseForm.receiptUrl || null,
          paymentMethod: expenseForm.paymentMethod,
          referenceNumber: expenseForm.referenceNumber || null,
          isBankCommission: expenseForm.isBankCommission,
          status: "paid",
        }),
      });

      notify("Gasto registrado y contabilizado exitosamente.");
      setShowCreateExpenseModal(false);
      setExpenseForm({
        categoryId: "",
        supplierId: "",
        concept: "",
        description: "",
        amount: "",
        currency: "USD",
        expenseDate: new Date().toISOString().split("T")[0],
        receiptUrl: "",
        paymentMethod: "transfer",
        referenceNumber: "",
        isBankCommission: false,
      });
      loadData();
    } catch (err: any) {
      notify(err.message || "Error al registrar el gasto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Create Budget
  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.categoryId || !budgetForm.amount) {
      notify("Seleccione categoría y monto del presupuesto.");
      return;
    }
    setIsSubmitting(true);
    try {
      await fetchApi("/budgets", {
        method: "POST",
        body: JSON.stringify({
          condominiumId: condoDetails.id,
          categoryId: budgetForm.categoryId,
          period: budgetForm.period || period,
          amount: budgetForm.amount,
          currency: budgetForm.currency,
          alertThresholdPct: budgetForm.alertThresholdPct || "80",
          notes: budgetForm.notes || null,
        }),
      });

      notify("Presupuesto fijado exitosamente.");
      setShowCreateBudgetModal(false);
      loadData();
    } catch (err: any) {
      notify(err.message || "Error al fijar el presupuesto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Create Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name) {
      notify("El nombre del proveedor es requerido.");
      return;
    }
    setIsSubmitting(true);
    try {
      await fetchApi("/suppliers", {
        method: "POST",
        body: JSON.stringify({
          condominiumId: condoDetails.id,
          name: supplierForm.name,
          taxId: supplierForm.taxId || null,
          contact: supplierForm.contact || null,
          email: supplierForm.email || null,
          phone: supplierForm.phone || null,
          address: supplierForm.address || null,
          creditDays: Number(supplierForm.creditDays) || 0,
          category: supplierForm.category || null,
          notes: supplierForm.notes || null,
        }),
      });

      notify("Proveedor registrado en el directorio.");
      setShowCreateSupplierModal(false);
      setSupplierForm({
        name: "",
        taxId: "",
        contact: "",
        email: "",
        phone: "",
        address: "",
        creditDays: 0,
        category: "",
        notes: "",
      });
      loadData();
    } catch (err: any) {
      notify(err.message || "Error al crear proveedor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Create Supplier Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.supplierId || !invoiceForm.invoiceNumber || !invoiceForm.amount) {
      notify("Complete los campos obligatorios de la factura.");
      return;
    }
    setIsSubmitting(true);
    try {
      await fetchApi("/supplier-invoices", {
        method: "POST",
        body: JSON.stringify({
          condominiumId: condoDetails.id,
          supplierId: invoiceForm.supplierId,
          categoryId: invoiceForm.categoryId || null,
          invoiceNumber: invoiceForm.invoiceNumber,
          amount: invoiceForm.amount,
          currency: invoiceForm.currency,
          issueDate: invoiceForm.issueDate,
          dueDate: invoiceForm.dueDate || null,
          notes: invoiceForm.notes || null,
          receiptUrl: invoiceForm.receiptUrl || null,
        }),
      });

      notify("Factura a crédito registrada en cuentas por pagar.");
      setShowCreateInvoiceModal(false);
      setInvoiceForm({
        supplierId: "",
        categoryId: "",
        invoiceNumber: "",
        amount: "",
        currency: "USD",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        notes: "",
        receiptUrl: "",
      });
      loadData();
    } catch (err: any) {
      notify(err.message || "Error al registrar factura.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Pay Supplier Invoice
  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceToPay || !payInvoiceForm.amount) {
      notify("Indique el monto a pagar.");
      return;
    }
    setIsSubmitting(true);
    try {
      await fetchApi(`/supplier-invoices/${selectedInvoiceToPay.id}/pay`, {
        method: "POST",
        body: JSON.stringify({
          condominiumId: condoDetails.id,
          amount: payInvoiceForm.amount,
          currency: selectedInvoiceToPay.currency || "USD",
          paymentDate: payInvoiceForm.paymentDate,
          method: payInvoiceForm.method,
          reference: payInvoiceForm.reference || null,
          receiptUrl: payInvoiceForm.receiptUrl || null,
          notes: payInvoiceForm.notes || null,
        }),
      });

      notify("Pago al proveedor registrado y contabilizado en gastos.");
      setShowPayInvoiceModal(false);
      setSelectedInvoiceToPay(null);
      loadData();
    } catch (err: any) {
      notify(err.message || "Error al procesar pago.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (selectedCategoryFilter !== "all" && exp.categoryId !== selectedCategoryFilter) {
        return false;
      }
      if (selectedStatusFilter !== "all" && exp.status !== selectedStatusFilter) {
        return false;
      }
      if (onlyBankCommissions && !exp.isBankCommission) {
        return false;
      }
      if (expenseSearch) {
        const query = expenseSearch.toLowerCase();
        const matchesConcept = exp.concept?.toLowerCase().includes(query);
        const matchesSupplier = exp.supplierName?.toLowerCase().includes(query);
        const matchesRef = exp.referenceNumber?.toLowerCase().includes(query);
        if (!matchesConcept && !matchesSupplier && !matchesRef) return false;
      }
      return true;
    });
  }, [expenses, selectedCategoryFilter, selectedStatusFilter, onlyBankCommissions, expenseSearch]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers;
    const query = supplierSearch.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.taxId?.toLowerCase().includes(query) ||
        s.contact?.toLowerCase().includes(query)
    );
  }, [suppliers, supplierSearch]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (invoiceStatusFilter !== "all" && inv.status !== invoiceStatusFilter) {
        return false;
      }
      return true;
    });
  }, [invoices, invoiceStatusFilter]);

  return (
    <div className="space-y-6">
      {/* ================= HEADER & KPI SECTION ================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <TrendingDown className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Gastos, Proveedores y Presupuestos
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                    Fase 6
                  </span>
                </h1>
                <p className="text-xs text-white/70 mt-0.5">
                  Control exhaustivo de egresos, cuentas por pagar a proveedores y ejecución presupuestaria
                </p>
              </div>
            </div>
          </div>

          {/* Period selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl text-white text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-300" />
              <span className="font-semibold text-white/80">Período:</span>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/15 cursor-pointer"
              title="Recargar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-300" : ""}`} />
            </button>

            <button
              onClick={() => setShowCreateExpenseModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-900/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Registrar Gasto
            </button>

            <button
              onClick={() => setShowCreateInvoiceModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-900/30 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Factura Proveedor
            </button>
          </div>
        </div>

        {/* 4 HERO KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* KPI 1: Ingresos vs Egresos (Flujo de Caja) */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="font-medium">Balance Operativo Mes</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  (cashflow?.netBalance ?? 0) >= 0
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {(cashflow?.netBalance ?? 0) >= 0 ? "Superávit (+)" : "Déficit (-)"}
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              ${Number(cashflow?.netBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-white/60">
              <span className="flex items-center gap-1 text-emerald-300">
                <TrendingUp className="w-3 h-3" /> Cobrado: ${Number(cashflow?.totalIncome ?? 0).toFixed(2)}
              </span>
              <span className="flex items-center gap-1 text-rose-300">
                <TrendingDown className="w-3 h-3" /> Gastado: ${Number(cashflow?.totalExpenses ?? 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* KPI 2: Presupuesto y Consumo Global */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="font-medium">Presupuesto Mensual</span>
              <span className="text-[10px] text-indigo-300 font-bold">
                {budgetsSummary?.globalPercentage ?? 0}% Consumido
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              ${Number(budgetsSummary?.totalSpent ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <span className="text-xs text-white/50 font-normal ml-1">
                / ${Number(budgetsSummary?.totalBudgeted ?? 0).toFixed(2)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (budgetsSummary?.globalPercentage ?? 0) >= 100
                    ? "bg-rose-500"
                    : (budgetsSummary?.globalPercentage ?? 0) >= 80
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
                style={{ width: `${Math.min(100, budgetsSummary?.globalPercentage ?? 0)}%` }}
              />
            </div>
          </div>

          {/* KPI 3: Cuentas por Pagar (Proveedores) */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="font-medium">Cuentas por Pagar</span>
              {cashflow?.overdueInvoicesCount > 0 ? (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                  <AlertTriangle className="w-3 h-3" /> {cashflow.overdueInvoicesCount} Vencidas
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Al día
                </span>
              )}
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              ${Number(cashflow?.totalAccountsPayable ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-[11px] text-white/60">
              {cashflow?.overdueAmount > 0 ? (
                <span className="text-rose-300 font-semibold">
                  ${Number(cashflow.overdueAmount).toFixed(2)} con vencimiento pasado
                </span>
              ) : (
                <span>Créditos comerciales vigentes</span>
              )}
            </div>
          </div>

          {/* KPI 4: Directorio y Comisiones Bancarias */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="font-medium">Directorio y Comisiones</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                BR-022 / BR-038
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-white flex items-center justify-between">
              <span>{suppliers.length} <span className="text-xs text-white/50 font-normal">Proveedores</span></span>
              <span className="text-base text-purple-300 font-bold">{categories.length} <span className="text-xs text-white/50 font-normal">Categorías</span></span>
            </div>
            <div className="mt-1 text-[11px] text-white/60">
              Comisiones bancarias integradas al gasto operativo
            </div>
          </div>
        </div>
      </div>

      {/* ================= TAB NAVIGATION ================= */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === "expenses"
              ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
              : "bg-white/5 hover:bg-white/10 text-white/75 hover:text-white"
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Registro de Gastos
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
            {expenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("budgets")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === "budgets"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
              : "bg-white/5 hover:bg-white/10 text-white/75 hover:text-white"
          }`}
        >
          <Percent className="w-4 h-4" />
          Presupuestos & Alertas
          {budgetsSummary?.items?.some((i: any) => i.alertStatus !== "normal") && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === "invoices"
              ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
              : "bg-white/5 hover:bg-white/10 text-white/75 hover:text-white"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Cuentas por Pagar (Facturas)
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
            {invoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("suppliers")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === "suppliers"
              ? "bg-teal-600 text-white shadow-md shadow-teal-900/30"
              : "bg-white/5 hover:bg-white/10 text-white/75 hover:text-white"
          }`}
        >
          <Truck className="w-4 h-4" />
          Directorio de Proveedores
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
            {suppliers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("cashflow")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
            activeTab === "cashflow"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
              : "bg-white/5 hover:bg-white/10 text-white/75 hover:text-white"
          }`}
        >
          <PieChartIcon className="w-4 h-4" />
          Flujo de Caja y Desglose
        </button>
      </div>

      {/* ================= TAB 1: REGISTRO DE GASTOS ================= */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex-1 w-full md:w-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Buscar por concepto, proveedor o referencia..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900/80 border border-white/15 text-white text-xs focus:outline-none"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Bank Commission Toggle */}
              <button
                onClick={() => setOnlyBankCommissions(!onlyBankCommissions)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  onlyBankCommissions
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "bg-white/5 border-white/15 text-white/70 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Solo Comisiones Bancarias
              </button>

              <button
                onClick={() => setShowCreateExpenseModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nuevo Gasto
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white">
                <thead className="bg-white/5 border-b border-white/10 text-white/60 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Concepto y Descripción</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Método / Ref</th>
                    <th className="py-3 px-4">Comprobante</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-white/50 text-xs">
                        No se encontraron gastos registrados con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-white/5 transition">
                        <td className="py-3.5 px-4 font-mono text-white/80 whitespace-nowrap">
                          {exp.expenseDate}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {exp.isBankCommission && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold border border-purple-500/30">
                                Comisión Bancaria
                              </span>
                            )}
                            <span className="truncate">{exp.concept}</span>
                          </div>
                          {exp.description && (
                            <p className="text-[11px] text-white/50 truncate mt-0.5">
                              {exp.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {exp.categoryName || "General"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-white/80 whitespace-nowrap">
                          {exp.supplierName ? (
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3 text-white/40" />
                              {exp.supplierName}
                            </span>
                          ) : (
                            <span className="text-white/40 italic">Directo / Caja</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-white/70 whitespace-nowrap">
                          <div className="capitalize">{exp.paymentMethod || "transfer"}</div>
                          {exp.referenceNumber && (
                            <div className="text-[10px] text-white/40">Ref: {exp.referenceNumber}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {exp.receiptUrl ? (
                            <a
                              href={exp.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200 underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver Factura
                            </a>
                          ) : (
                            <span className="text-white/30 text-[11px] italic">Sin adjunto</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-rose-300 whitespace-nowrap">
                          ${parseFloat(exp.amount || "0").toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              exp.status === "paid"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : exp.status === "pending"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            <CheckCircle className="w-3 h-3" />
                            {exp.status === "paid"
                              ? "Pagado"
                              : exp.status === "pending"
                              ? "Pendiente"
                              : "Rechazado"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PRESUPUESTOS Y ALERTAS (BR-039) ================= */}
      {activeTab === "budgets" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Ejecución Presupuestaria por Categoría
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Período: {period}
                </span>
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                Supervisión automática de límites de gasto con alertas preventivas al alcanzar el umbral configurado (80% default).
              </p>
            </div>

            <button
              onClick={() => {
                setBudgetForm({
                  categoryId: categories[0]?.id || "",
                  period: period,
                  amount: "",
                  currency: "USD",
                  alertThresholdPct: "80",
                  notes: "",
                });
                setShowCreateBudgetModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-900/30 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Fijar Presupuesto
            </button>
          </div>

          {/* Budgets Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(!budgetsSummary?.items || budgetsSummary.items.length === 0) ? (
              <div className="col-span-full py-12 text-center text-white/50 text-xs bg-slate-900/40 rounded-2xl border border-white/10">
                No hay presupuestos definidos para el período {period}. Haga clic en "Fijar Presupuesto" para comenzar.
              </div>
            ) : (
              budgetsSummary.items.map((item: any) => {
                const isOver = item.alertStatus === "danger";
                const isWarning = item.alertStatus === "warning";

                return (
                  <div
                    key={item.id}
                    className={`bg-slate-900/70 border rounded-2xl p-5 backdrop-blur-md relative overflow-hidden transition hover:border-white/20 ${
                      isOver
                        ? "border-rose-500/50 shadow-lg shadow-rose-950/20"
                        : isWarning
                        ? "border-amber-500/40 shadow-lg shadow-amber-950/20"
                        : "border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-sm">
                        {item.categoryName}
                      </span>
                      {isOver ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/40 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Excedido
                        </span>
                      ) : isWarning ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                          <AlertCircle className="w-3 h-3" /> Umbral {item.alertThresholdPct}%
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          Normal
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-baseline justify-between">
                      <div>
                        <div className="text-[11px] text-white/50">Ejecutado</div>
                        <div className="text-xl font-black text-white font-mono">
                          ${item.spentAmount.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-white/50">Límite Aprobado</div>
                        <div className="text-sm font-bold text-white/80 font-mono">
                          ${item.budgetAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? "bg-rose-500" : isWarning ? "bg-amber-400" : "bg-emerald-400"
                        }`}
                        style={{ width: `${Math.min(100, item.spentPercentage)}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-white/60">
                      <span>{item.spentPercentage}% consumido</span>
                      <span>
                        Disponible:{" "}
                        <strong className={item.remainingAmount === 0 ? "text-rose-400" : "text-white"}>
                          ${item.remainingAmount.toFixed(2)}
                        </strong>
                      </span>
                    </div>

                    {item.notes && (
                      <p className="mt-3 text-[11px] text-white/40 italic border-t border-white/5 pt-2">
                        {item.notes}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: CUENTAS POR PAGAR (FACTURAS PROVEEDOR) ================= */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Facturas a Crédito y Cuentas por Pagar (BR-040)
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                Monitoreo de vencimientos, abonos parciales y liquidación de facturas con proveedores.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="partially_paid">Abonadas (Parcial)</option>
                <option value="paid">Pagadas</option>
                <option value="overdue">⚠️ Vencidas</option>
              </select>

              <button
                onClick={() => setShowCreateInvoiceModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-900/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Registrar Factura
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white">
                <thead className="bg-white/5 border-b border-white/10 text-white/60 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nº Factura</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Emisión</th>
                    <th className="py-3 px-4">Vencimiento</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Abonado</th>
                    <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-white/50 text-xs">
                        No hay facturas comerciales en este estado.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/5 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div>{inv.supplierName}</div>
                          {inv.supplierTaxId && (
                            <span className="text-[10px] text-white/40 font-mono">
                              {inv.supplierTaxId}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-white/70 whitespace-nowrap">
                          {inv.issueDate}
                        </td>
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          <span className={inv.status === "overdue" ? "text-rose-400 font-bold" : "text-white/70"}>
                            {inv.dueDate || "Inmediato"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                          ${parseFloat(inv.amount || "0").toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-300 whitespace-nowrap">
                          ${parseFloat(inv.paidAmount || "0").toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm text-rose-300 whitespace-nowrap">
                          ${parseFloat(inv.pendingAmount || "0").toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === "paid"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : inv.status === "partially_paid"
                                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                : inv.status === "overdue"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {inv.status === "paid"
                              ? "Pagada"
                              : inv.status === "partially_paid"
                              ? "Abonada"
                              : inv.status === "overdue"
                              ? "Vencida"
                              : "Pendiente"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {inv.status !== "paid" ? (
                            <button
                              onClick={() => {
                                setSelectedInvoiceToPay(inv);
                                setPayInvoiceForm({
                                  amount: inv.pendingAmount,
                                  paymentDate: new Date().toISOString().split("T")[0],
                                  method: "transfer",
                                  reference: "",
                                  receiptUrl: "",
                                  notes: `Abono de factura ${inv.invoiceNumber}`,
                                });
                                setShowPayInvoiceModal(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-sm"
                            >
                              Pagar / Abonar
                            </button>
                          ) : (
                            <span className="text-emerald-400/60 text-xs font-semibold">Liquidada</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: DIRECTORIO DE PROVEEDORES ================= */}
      {activeTab === "suppliers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Buscar proveedor por nombre, RIF o contacto..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              onClick={() => setShowCreateSupplierModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-lg shadow-teal-900/30 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proveedor
            </button>
          </div>

          {/* Suppliers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.length === 0 ? (
              <div className="col-span-full py-12 text-center text-white/50 text-xs bg-slate-900/40 rounded-2xl border border-white/10">
                No hay proveedores registrados en el directorio.
              </div>
            ) : (
              filteredSuppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md hover:border-teal-500/30 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-white text-sm">{sup.name}</h3>
                        {sup.taxId && (
                          <div className="text-[10px] text-white/40 font-mono mt-0.5">
                            RIF / Tax: {sup.taxId}
                          </div>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">
                        {sup.creditDays > 0 ? `${sup.creditDays} días crédito` : "Contado"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-white/70">
                      {sup.contact && (
                        <div>
                          <span className="text-white/40">Contacto:</span> {sup.contact}
                        </div>
                      )}
                      {sup.phone && (
                        <div>
                          <span className="text-white/40">Teléfono:</span> {sup.phone}
                        </div>
                      )}
                      {sup.email && (
                        <div>
                          <span className="text-white/40">Email:</span> {sup.email}
                        </div>
                      )}
                      {sup.address && (
                        <div className="truncate">
                          <span className="text-white/40">Dirección:</span> {sup.address}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-white/40">
                      Rubro: {sup.category || "General"}
                    </span>
                    <button
                      onClick={() => {
                        setInvoiceForm((prev) => ({
                          ...prev,
                          supplierId: sup.id,
                        }));
                        setShowCreateInvoiceModal(true);
                      }}
                      className="text-xs text-indigo-300 hover:text-indigo-200 font-semibold cursor-pointer"
                    >
                      + Factura
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 5: FLUJO DE CAJA & DESGLOSE (INGRESOS VS EGRESOS) ================= */}
      {activeTab === "cashflow" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Balance General del Período */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Resumen de Ingresos vs Egresos ({period})
              </h3>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Ingresos Totales (Cobranza)</div>
                      <div className="text-[10px] text-white/50">Recaudación verificada de alícuotas</div>
                    </div>
                  </div>
                  <div className="text-base font-black text-emerald-300 font-mono">
                    +${Number(cashflow?.totalIncome ?? 0).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Egresos Totales (Gastos Operativos)</div>
                      <div className="text-[10px] text-white/50">Mantenimiento, servicios y proveedores</div>
                    </div>
                  </div>
                  <div className="text-base font-black text-rose-300 font-mono">
                    -${Number(cashflow?.totalExpenses ?? 0).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950/40 border border-white/15">
                  <div>
                    <div className="text-xs font-extrabold text-white">Flujo Neto de Caja</div>
                    <div className="text-[10px] text-white/50">Superávit / Déficit acumulado en el mes</div>
                  </div>
                  <div
                    className={`text-xl font-black font-mono ${
                      (cashflow?.netBalance ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    ${Number(cashflow?.netBalance ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Desglose de Gastos por Categoría */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-400" />
                Desglose de Gastos por Categoría
              </h3>

              {(!cashflow?.expensesByCategory || cashflow.expensesByCategory.length === 0) ? (
                <div className="py-8 text-center text-white/40 text-xs">
                  No hay gastos registrados en el período {period} para calcular desglose.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {cashflow.expensesByCategory.map((cat: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{cat.name}</span>
                        <span className="font-mono text-white/80">
                          ${cat.amount.toFixed(2)}{" "}
                          <span className="text-[10px] text-white/40">({cat.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(100, cat.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: REGISTRAR GASTO ================= */}
      {showCreateExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                Registrar Gasto Operativo
              </h3>
              <button
                onClick={() => setShowCreateExpenseModal(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Categoría de Gasto *
                </label>
                <select
                  required
                  value={expenseForm.categoryId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Concepto / Motivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mantenimiento preventivo ascensores, compra de cloro..."
                  value={expenseForm.concept}
                  onChange={(e) => setExpenseForm({ ...expenseForm, concept: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Monto * ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Fecha del Gasto *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Proveedor (Opcional)
                  </label>
                  <select
                    value={expenseForm.supplierId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                  >
                    <option value="">Gasto directo / Sin proveedor</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                  >
                    <option value="transfer">Transferencia Bancaria</option>
                    <option value="mobile_payment">Pago Móvil</option>
                    <option value="cash">Efectivo (Caja Chica)</option>
                    <option value="debit">Tarjeta de Débito</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Nº Referencia / Comprobante
                </label>
                <input
                  type="text"
                  placeholder="Ej: TRANS-12345 o Factura 0081"
                  value={expenseForm.referenceNumber}
                  onChange={(e) => setExpenseForm({ ...expenseForm, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                />
              </div>

              {/* Bank commission checkbox */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <input
                  type="checkbox"
                  id="isCommissionCheck"
                  checked={expenseForm.isBankCommission}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, isBankCommission: e.target.checked })
                  }
                  className="rounded bg-white/10 border-white/20 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="isCommissionCheck" className="text-xs text-purple-200 cursor-pointer">
                  Marcar como <strong>Comisión Bancaria / Débito Financiero</strong> (BR-022)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-900/30"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: FIJAR PRESUPUESTO ================= */}
      {showCreateBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-400" />
                Fijar Presupuesto Mensual
              </h3>
              <button
                onClick={() => setShowCreateBudgetModal(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Categoría de Gasto *
                </label>
                <select
                  required
                  value={budgetForm.categoryId}
                  onChange={(e) => setBudgetForm({ ...budgetForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Período (AAAA-MM) *
                  </label>
                  <input
                    type="month"
                    required
                    value={budgetForm.period}
                    onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Monto Límite ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={budgetForm.amount}
                    onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Umbral de Alerta (% default 80%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={budgetForm.alertThresholdPct}
                  onChange={(e) =>
                    setBudgetForm({ ...budgetForm, alertThresholdPct: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Notas / Justificación
                </label>
                <textarea
                  rows={2}
                  value={budgetForm.notes}
                  onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                  placeholder="Detalles del acuerdo o asamblea..."
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateBudgetModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-900/30"
                >
                  {isSubmitting ? "Guardando..." : "Asignar Presupuesto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: NUEVO PROVEEDOR ================= */}
      {showCreateSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-400" />
                Alta de Proveedor Comercial
              </h3>
              <button
                onClick={() => setShowCreateSupplierModal(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Razón Social / Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ascensores Schindler C.A."
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    RIF / NIT / Tax ID
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: J-12345678-9"
                    value={supplierForm.taxId}
                    onChange={(e) => setSupplierForm({ ...supplierForm, taxId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Días de Crédito (0 = Contado)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={supplierForm.creditDays}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, creditDays: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Ing. Carlos Pérez"
                    value={supplierForm.contact}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="+58 212 900-1122"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="contacto@proveedor.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateSupplierModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-lg shadow-teal-900/30"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: REGISTRAR FACTURA DE PROVEEDOR ================= */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Registrar Factura de Proveedor
              </h3>
              <button
                onClick={() => setShowCreateInvoiceModal(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Proveedor Emisor *
                </label>
                <select
                  required
                  value={invoiceForm.supplierId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, supplierId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                >
                  <option value="">Seleccione el proveedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.creditDays} días crédito)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Nº de Factura / Control *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: FAC-2026-901"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Monto Total ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Fecha de Emisión *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.issueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Categoría de Gasto Asociada
                </label>
                <select
                  value={invoiceForm.categoryId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                >
                  <option value="">Seleccione categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-900/30"
                >
                  {isSubmitting ? "Guardando..." : "Registrar Factura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: PAGAR FACTURA PROVEEDOR ================= */}
      {showPayInvoiceModal && selectedInvoiceToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Pagar Factura a Proveedor
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Factura {selectedInvoiceToPay.invoiceNumber} — {selectedInvoiceToPay.supplierName}
                </p>
              </div>
              <button
                onClick={() => setShowPayInvoiceModal(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayInvoice} className="space-y-4 mt-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-white/50 uppercase font-bold">Saldo Pendiente</div>
                  <div className="text-lg font-black text-rose-300 font-mono">
                    ${parseFloat(selectedInvoiceToPay.pendingAmount || "0").toFixed(2)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPayInvoiceForm({
                      ...payInvoiceForm,
                      amount: selectedInvoiceToPay.pendingAmount,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition cursor-pointer"
                >
                  Pagar Todo (100%)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Monto a Abonar / Pagar * ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  max={selectedInvoiceToPay.pendingAmount}
                  value={payInvoiceForm.amount}
                  onChange={(e) =>
                    setPayInvoiceForm({ ...payInvoiceForm, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Fecha de Pago *
                  </label>
                  <input
                    type="date"
                    required
                    value={payInvoiceForm.paymentDate}
                    onChange={(e) =>
                      setPayInvoiceForm({ ...payInvoiceForm, paymentDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={payInvoiceForm.method}
                    onChange={(e) =>
                      setPayInvoiceForm({ ...payInvoiceForm, method: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none"
                  >
                    <option value="transfer">Transferencia Bancaria</option>
                    <option value="mobile_payment">Pago Móvil</option>
                    <option value="cash">Efectivo</option>
                    <option value="check">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Nº Referencia / Transferencia
                </label>
                <input
                  type="text"
                  placeholder="Ej: TRANS-BANCARIA-8831"
                  value={payInvoiceForm.reference}
                  onChange={(e) =>
                    setPayInvoiceForm({ ...payInvoiceForm, reference: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPayInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-900/30"
                >
                  {isSubmitting ? "Procesando..." : "Confirmar Pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
