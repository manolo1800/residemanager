"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Building,
  UserCheck,
  UserX,
  CreditCard,
  Printer,
  X,
  RefreshCw,
  TrendingDown,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
  Download,
  Percent,
  CalendarCheck2,
  FileEdit,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { fetchApi } from "../../../lib/api";

interface StaffPayrollViewProps {
  condoDetails: any;
  currentUser: any;
  notify: (msg: string) => void;
}

export function StaffPayrollView({
  condoDetails,
  currentUser,
  notify,
}: StaffPayrollViewProps) {
  // Navigation tabs inside Staff & Payroll module
  const [activeTab, setActiveTab] = useState<
    "staff" | "attendance" | "payroll" | "advances" | "templates"
  >("staff");

  // Loading and data states
  const [loading, setLoading] = useState<boolean>(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [payrollItems, setPayrollItems] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // Filters & Search
  const [staffSearch, setStaffSearch] = useState<string>("");
  const [contractTypeFilter, setContractTypeFilter] = useState<string>("all");
  const [staffStatusFilter, setStaffStatusFilter] = useState<string>("all");

  // Modals state
  const [showCreateStaffModal, setShowCreateStaffModal] = useState<boolean>(false);
  const [showCreateAdvanceModal, setShowCreateAdvanceModal] = useState<boolean>(false);
  const [showCreatePeriodModal, setShowCreatePeriodModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [selectedReceiptItem, setSelectedReceiptItem] = useState<any>(null);
  const [showContractModal, setShowContractModal] = useState<boolean>(false);
  const [contractPreviewData, setContractPreviewData] = useState<any>(null);

  // Forms state
  const [staffForm, setStaffForm] = useState({
    personDocType: "V",
    personDocNumber: "",
    personFullName: "",
    personEmail: "",
    personPhone: "",
    position: "Conserje / Mantenimiento",
    contractType: "individual",
    hireDate: new Date().toISOString().slice(0, 10),
    salary: "450.00",
    salaryCurrency: "USD",
    payFrequency: "biweekly",
    bankName: "Banco Mercantil",
    bankAccount: "",
    documentUrl: "",
    notes: "",
  });

  const [advanceForm, setAdvanceForm] = useState({
    staffId: "",
    amount: "100.00",
    currency: "USD",
    reason: "",
    installments: 2,
  });

  const [periodForm, setPeriodForm] = useState({
    startDate: new Date().toISOString().slice(0, 8) + "01",
    endDate: new Date().toISOString().slice(0, 8) + "15",
  });

  // Current condo ID
  const condoId = condoDetails?.id;
  const currencySymbol = condoDetails?.currencySymbol || "$";

  // 1. Initial Load of all staff data
  const loadAllData = async () => {
    if (!condoId) return;
    setLoading(true);
    try {
      // Load staff
      const staffRes = await fetchApi<any[]>(`/staff?condominiumId=${condoId}`, {}, condoId);
      setStaffList(staffRes || []);

      // Load payroll periods
      const periodsRes = await fetchApi<any[]>(`/payroll-periods?condominiumId=${condoId}`, {}, condoId);
      setPayrollPeriods(periodsRes || []);
      if (periodsRes && periodsRes.length > 0) {
        setSelectedPeriod(periodsRes[0]);
        // Load items of the first period
        const itemsRes = await fetchApi<any[]>(`/payroll-periods/${periodsRes[0].id}/items`, {}, condoId);
        setPayrollItems(itemsRes || []);
      }

      // Load advances
      const advancesRes = await fetchApi<any[]>(`/staff-advances?condominiumId=${condoId}`, {}, condoId);
      setAdvances(advancesRes || []);

      // Load contract templates
      const templatesRes = await fetchApi<any[]>(`/contract-templates`, {}, condoId);
      setTemplates(templatesRes || []);

      // Load attendance for current date
      const attendanceRes = await fetchApi<any[]>(
        `/staff-attendance?condominiumId=${condoId}&date=${attendanceDate}`,
        {},
        condoId
      );
      setAttendanceRecords(attendanceRes || []);
    } catch (err: any) {
      console.error("Error cargando datos de personal y nómina:", err);
      notify(err.message || "Error al sincronizar datos de personal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [condoId]);

  // Load attendance when date changes
  useEffect(() => {
    if (!condoId || !attendanceDate) return;
    fetchApi<any[]>(
      `/staff-attendance?condominiumId=${condoId}&date=${attendanceDate}`,
      {},
      condoId
    )
      .then((res) => setAttendanceRecords(res || []))
      .catch((err) => console.error("Error cargando asistencia:", err));
  }, [attendanceDate, condoId]);

  // Handle period selection change
  const handleSelectPeriod = async (period: any) => {
    setSelectedPeriod(period);
    try {
      const itemsRes = await fetchApi<any[]>(`/payroll-periods/${period.id}/items`, {}, condoId);
      setPayrollItems(itemsRes || []);
    } catch (err: any) {
      notify("Error al cargar los ítems del período seleccionado");
    }
  };

  // KPIs Calculations
  const stats = useMemo(() => {
    const activeStaff = staffList.filter((s) => s.status === "active");
    const totalMonthlyPayroll = activeStaff.reduce((acc, curr) => {
      const sal = Number(curr.salary) || 0;
      if (curr.payFrequency === "weekly") return acc + sal * 4;
      return acc + sal;
    }, 0);

    const individualCount = activeStaff.filter((s) => s.contractType === "individual").length;
    const companyCount = activeStaff.filter((s) => s.contractType === "company").length;
    const cooperativeCount = activeStaff.filter((s) => s.contractType === "cooperative").length;

    const pendingAdvances = advances.filter((a) => a.status === "pending").length;
    const totalRemainingAdvances = advances
      .filter((a) => a.status === "approved")
      .reduce((acc, curr) => acc + (Number(curr.remaining) || 0), 0);

    return {
      activeWorkers: activeStaff.length,
      totalMonthlyPayroll,
      individualCount,
      companyCount,
      cooperativeCount,
      pendingAdvances,
      totalRemainingAdvances,
    };
  }, [staffList, advances]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch =
        s.personName?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.position?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.personDocNumber?.includes(staffSearch);
      const matchesType =
        contractTypeFilter === "all" || s.contractType === contractTypeFilter;
      const matchesStatus =
        staffStatusFilter === "all" || s.status === staffStatusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [staffList, staffSearch, contractTypeFilter, staffStatusFilter]);

  // Handler: Create Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi(
        "/staff",
        {
          method: "POST",
          body: JSON.stringify({
            condominiumId: condoId,
            person: {
              documentType: staffForm.personDocType,
              documentNumber: staffForm.personDocNumber,
              fullName: staffForm.personFullName,
              email: staffForm.personEmail || undefined,
              phone: staffForm.personPhone || undefined,
            },
            position: staffForm.position,
            contractType: staffForm.contractType,
            hireDate: staffForm.hireDate,
            salary: staffForm.salary,
            salaryCurrency: staffForm.salaryCurrency,
            payFrequency: staffForm.payFrequency,
            bankName: staffForm.bankName,
            bankAccount: staffForm.bankAccount,
            documentUrl: staffForm.documentUrl,
            notes: staffForm.notes,
            status: "active",
          }),
        },
        condoId
      );

      notify(`Trabajador '${staffForm.personFullName}' registrado exitosamente.`);
      setShowCreateStaffModal(false);
      loadAllData();
    } catch (err: any) {
      notify(err.message || "Error al crear trabajador");
    }
  };

  // Handler: Attendance quick record
  const handleQuickAttendance = async (staffId: string, status: "present" | "late" | "absent" | "justified") => {
    try {
      const now = new Date();
      const checkInTime =
        status === "present" || status === "late"
          ? `${attendanceDate}T${now.toTimeString().slice(0, 8)}Z`
          : null;

      await fetchApi(
        "/staff-attendance",
        {
          method: "POST",
          body: JSON.stringify({
            staffId,
            date: attendanceDate,
            status,
            checkIn: checkInTime,
            notes: status === "late" ? "Registrado con retraso" : status === "justified" ? "Permiso justificado" : "Marcaje diario",
          }),
        },
        condoId
      );

      notify("Asistencia registrada correctamente.");
      // Reload attendance records
      const updated = await fetchApi<any[]>(
        `/staff-attendance?condominiumId=${condoId}&date=${attendanceDate}`,
        {},
        condoId
      );
      setAttendanceRecords(updated || []);
    } catch (err: any) {
      notify(err.message || "Error al registrar asistencia");
    }
  };

  // Handler: Create Payroll Period
  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await fetchApi(
        "/payroll-periods",
        {
          method: "POST",
          body: JSON.stringify({
            condominiumId: condoId,
            startDate: periodForm.startDate,
            endDate: periodForm.endDate,
          }),
        },
        condoId
      );

      notify(`Período de nómina creado con cálculo automático (${periodForm.startDate} al ${periodForm.endDate}).`);
      setShowCreatePeriodModal(false);
      loadAllData();
    } catch (err: any) {
      notify(err.message || "Error al crear período de nómina");
    }
  };

  // Handler: Close Payroll Period
  const handleClosePeriod = async () => {
    if (!selectedPeriod) return;
    if (!confirm(`¿Deseas cerrar la nómina del período ${selectedPeriod.startDate} al ${selectedPeriod.endDate}? Los descuentos de adelantos serán debitados permanentemente.`)) {
      return;
    }

    try {
      await fetchApi(
        `/payroll-periods/${selectedPeriod.id}/close`,
        { method: "POST" },
        condoId
      );
      notify("Período de nómina cerrado con éxito. Descuentos consolidados.");
      loadAllData();
    } catch (err: any) {
      notify(err.message || "Error al cerrar nómina");
    }
  };

  // Handler: Mark Period as Paid
  const handlePayPeriod = async () => {
    if (!selectedPeriod) return;
    try {
      await fetchApi(
        `/payroll-periods/${selectedPeriod.id}/pay`,
        { method: "POST" },
        condoId
      );
      notify("Período de nómina marcado como PAGADO. Todos los recibos quedaron cancelados.");
      loadAllData();
    } catch (err: any) {
      notify(err.message || "Error al marcar nómina como pagada");
    }
  };

  // Handler: Create Advance
  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi(
        "/staff-advances",
        {
          method: "POST",
          body: JSON.stringify({
            staffId: advanceForm.staffId,
            amount: advanceForm.amount,
            currency: advanceForm.currency,
            reason: advanceForm.reason,
            installments: Number(advanceForm.installments),
          }),
        },
        condoId
      );

      notify("Solicitud de adelanto registrada exitosamente.");
      setShowCreateAdvanceModal(false);
      loadAllData();
    } catch (err: any) {
      notify(err.message || "Error al registrar adelanto");
    }
  };

  // Handler: Approve/Reject Advance
  const handleApproveAdvance = async (id: string, status: "approved" | "rejected") => {
    try {
      await fetchApi(
        `/staff-advances/${id}/approve`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
        condoId
      );

      notify(`Adelanto ${status === "approved" ? "aprobado" : "rechazado"} con éxito.`);
      loadAllData();
    } catch (err: any) {
      notify(err.message || "Error al procesar adelanto");
    }
  };

  // Handler: Generate Contract PDF Preview
  const handleGenerateContract = async (worker: any) => {
    try {
      const res: any = await fetchApi(
        `/staff/${worker.id}/contracts/generate`,
        {
          method: "POST",
          body: JSON.stringify({
            staffId: worker.id,
            validFrom: worker.hireDate,
          }),
        },
        condoId
      );

      // Find template
      const tpl = templates.find((t) => t.id === res.templateId) || templates[0];
      const identification = `${worker.personDocType}-${worker.personDocNumber}`;
      const fullText = (tpl?.body || "")
        .replace(/\{\{condo_name\}\}/g, condoDetails?.name || "Residencias")
        .replace(/\{\{worker_name\}\}/g, worker.personName)
        .replace(/\{\{identification\}\}/g, identification)
        .replace(/\{\{position\}\}/g, worker.position)
        .replace(/\{\{salary\}\}/g, String(worker.salary))
        .replace(/\{\{currency\}\}/g, worker.salaryCurrency)
        .replace(/\{\{frequency\}\}/g, worker.payFrequency)
        .replace(/\{\{hire_date\}\}/g, worker.hireDate);

      setContractPreviewData({
        worker,
        contract: res,
        bodyText: fullText,
        templateName: tpl?.name || "Contrato de Trabajo",
      });
      setShowContractModal(true);
      notify("Contrato generado con éxito a partir de la plantilla oficial.");
    } catch (err: any) {
      notify(err.message || "Error al generar contrato");
    }
  };

  // Open Receipt Modal
  const handleOpenReceipt = (item: any) => {
    setSelectedReceiptItem(item);
    setShowReceiptModal(true);
  };

  return (
    <div className="space-y-6">
      {/* ================= HEADER PRINCIPAL ================= */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-sky-800/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              Recursos Humanos & Nómina • Fase 7
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Personal, Nómina y Asistencia
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Gestión integral de colaboradores del condominio: contratos con 3 modalidades legales,
              control de asistencia diaria, cálculo de nómina con descuentos automáticos de adelantos y recibos PDF oficiales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateAdvanceModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition border border-white/15 backdrop-blur-md"
            >
              <CreditCard className="w-4 h-4 text-amber-300" />
              Solicitar Adelanto
            </button>
            <button
              onClick={() => setShowCreatePeriodModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition border border-white/15 backdrop-blur-md"
            >
              <CalendarCheck2 className="w-4 h-4 text-emerald-300" />
              Nuevo Período Nómina
            </button>
            <button
              onClick={() => setShowCreateStaffModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-lg shadow-sky-600/30"
            >
              <Plus className="w-4 h-4" />
              Registrar Personal
            </button>
          </div>
        </div>

        {/* ================= TARJETAS KPIS ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Personal Activo</span>
              <UserCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.activeWorkers}</div>
            <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
              <span className="text-sky-300 font-semibold">{stats.individualCount} Ind.</span>
              <span>•</span>
              <span className="text-amber-300 font-semibold">{stats.companyCount} Emp.</span>
              <span>•</span>
              <span className="text-emerald-300 font-semibold">{stats.cooperativeCount} Coop.</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Nómina Mensual Est.</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {currencySymbol}{stats.totalMonthlyPayroll.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-300 mt-1 font-medium">
              Sueldos y honorarios fijos
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Saldo Adelantos Activos</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {currencySymbol}{stats.totalRemainingAdvances.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-amber-300 mt-1">
              {stats.pendingAdvances} pendientes de aprobar
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Períodos de Nómina</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{payrollPeriods.length}</div>
            <div className="text-[10px] text-purple-300 mt-1">
              {payrollPeriods.filter((p) => p.status === "paid").length} pagados • {payrollPeriods.filter((p) => p.status === "draft").length} en borrador
            </div>
          </div>
        </div>
      </div>

      {/* ================= TABS DE NAVEGACIÓN ================= */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "staff"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          Plantilla de Personal ({staffList.length})
        </button>

        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "attendance"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          Control de Asistencia
        </button>

        <button
          onClick={() => setActiveTab("payroll")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "payroll"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Nómina y Recibos PDF
        </button>

        <button
          onClick={() => setActiveTab("advances")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "advances"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Adelantos de Sueldo ({advances.length})
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "templates"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          Plantillas de Contrato ({templates.length})
        </button>

        <button
          onClick={loadAllData}
          title="Recargar datos"
          className="ml-auto p-2 bg-white text-slate-500 hover:text-slate-900 rounded-xl border border-slate-200 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ================= CONTENIDO DE TAB 1: PERSONAL ================= */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre, cargo o documento..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={contractTypeFilter}
                onChange={(e) => setContractTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                <option value="all">Todos los Contratos</option>
                <option value="individual">Individual (Particular)</option>
                <option value="company">Empresa (Seguridad/Servicios)</option>
                <option value="cooperative">Cooperativa (Jardinería)</option>
              </select>

              <select
                value={staffStatusFilter}
                onChange={(e) => setStaffStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                <option value="all">Todos los Estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="terminated">Terminados</option>
              </select>
            </div>
          </div>

          {/* Listado de Trabajadores */}
          {filteredStaff.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">No se encontraron trabajadores</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay registros que coincidan con la búsqueda. Puedes registrar un nuevo trabajador haciendo clic en "Registrar Personal".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((worker) => (
                <div
                  key={worker.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white font-black text-sm flex items-center justify-center shadow-md shadow-sky-500/20">
                        {worker.personName?.slice(0, 2).toUpperCase() || "ST"}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{worker.personName}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <span>{worker.personDocType}-{worker.personDocNumber}</span>
                          <span>•</span>
                          <span className="text-sky-700 font-semibold">{worker.position}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        worker.contractType === "individual"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : worker.contractType === "company"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {worker.contractType === "individual"
                        ? "Individual"
                        : worker.contractType === "company"
                        ? "Empresa (RIF)"
                        : "Cooperativa"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium uppercase">Remuneración</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {currencySymbol}{Number(worker.salary).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {worker.payFrequency === "biweekly" ? "Quincenal" : worker.payFrequency === "weekly" ? "Semanal" : "Mensual"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium uppercase">Ingreso</span>
                      <span className="font-semibold text-slate-800">{worker.hireDate}</span>
                      <span className="text-[10px] text-emerald-600 font-medium block">
                        {worker.status === "active" ? "● Activo" : "● Inactivo"}
                      </span>
                    </div>
                  </div>

                  {worker.bankName && (
                    <div className="text-[11px] text-slate-600 bg-slate-50/50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="font-medium text-slate-500">{worker.bankName}:</span>
                      <span className="font-mono text-slate-700">{worker.bankAccount || "Cuenta no especificada"}</span>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleGenerateContract(worker)}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      Contrato Legal
                    </button>
                    {worker.documentUrl && (
                      <a
                        href={worker.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition"
                        title="Ver documento adjunto (cédula/RIF)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= CONTENIDO DE TAB 2: ASISTENCIA ================= */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Control de Asistencia y Puntualidad</h3>
                <p className="text-xs text-slate-500">Registro de asistencia diaria por colaborador</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const d = new Date(attendanceDate);
                  d.setDate(d.getDate() - 1);
                  setAttendanceDate(d.toISOString().slice(0, 10));
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />

              <button
                onClick={() => {
                  const d = new Date(attendanceDate);
                  d.setDate(d.getDate() + 1);
                  setAttendanceDate(d.toISOString().slice(0, 10));
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setAttendanceDate(new Date().toISOString().slice(0, 10))}
                className="px-3 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-bold transition"
              >
                Hoy
              </button>
            </div>
          </div>

          {/* Tabla de Asistencia del Día */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Trabajadores del Condominio — Fecha: {attendanceDate}
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  ● {attendanceRecords.filter((r) => r.status === "present").length} Presentes
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  ● {attendanceRecords.filter((r) => r.status === "late").length} Tardanzas
                </span>
                <span className="flex items-center gap-1 text-rose-600 font-semibold">
                  ● {attendanceRecords.filter((r) => r.status === "absent").length} Ausentes
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {staffList
                .filter((s) => s.status === "active")
                .map((worker) => {
                  const record = attendanceRecords.find((r) => r.staffId === worker.id);
                  const currentStatus = record?.status;

                  return (
                    <div
                      key={worker.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {worker.personName?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{worker.personName}</h4>
                          <span className="text-xs text-slate-500 font-medium">
                            {worker.position} • {worker.contractType}
                          </span>
                        </div>
                      </div>

                      {/* Estado y Acciones Rápidas */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickAttendance(worker.id, "present")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            currentStatus === "present"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Presente
                        </button>

                        <button
                          onClick={() => handleQuickAttendance(worker.id, "late")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            currentStatus === "late"
                              ? "bg-amber-600 text-white shadow-sm"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Tardanza
                        </button>

                        <button
                          onClick={() => handleQuickAttendance(worker.id, "absent")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            currentStatus === "absent"
                              ? "bg-rose-600 text-white shadow-sm"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                          }`}
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Ausente
                        </button>

                        <button
                          onClick={() => handleQuickAttendance(worker.id, "justified")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            currentStatus === "justified"
                              ? "bg-sky-600 text-white shadow-sm"
                              : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Justificado
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ================= CONTENIDO DE TAB 3: NÓMINA ================= */}
      {activeTab === "payroll" && (
        <div className="space-y-5">
          {/* Selector de Período y Acciones */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {selectedPeriod
                    ? `Período: ${selectedPeriod.startDate} al ${selectedPeriod.endDate}`
                    : "Selecciona un Período"}
                </h3>
                <span
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${
                    selectedPeriod?.status === "paid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : selectedPeriod?.status === "closed"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {selectedPeriod?.status === "paid"
                    ? "✓ Pagada Completamente"
                    : selectedPeriod?.status === "closed"
                    ? "Cerrada (Lista para Pago)"
                    : "Borrador (En Proceso)"}
                </span>
              </div>
            </div>

            {/* Selector de Períodos */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedPeriod?.id || ""}
                onChange={(e) => {
                  const p = payrollPeriods.find((x) => x.id === e.target.value);
                  if (p) handleSelectPeriod(p);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                {payrollPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.startDate} al {p.endDate} ({p.status.toUpperCase()})
                  </option>
                ))}
              </select>

              {selectedPeriod?.status === "draft" && (
                <button
                  onClick={handleClosePeriod}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md"
                >
                  Cerrar y Consolidar
                </button>
              )}

              {selectedPeriod?.status === "closed" && (
                <button
                  onClick={handlePayPeriod}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Marcar como Pagada
                </button>
              )}
            </div>
          </div>

          {/* Tabla de Ítems de Nómina */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Desglose Individual de Sueldos y Deducciones
              </span>
              <span className="text-xs font-bold text-slate-900">
                Total Neto Período: {currencySymbol}
                {payrollItems
                  .reduce((acc, curr) => acc + (Number(curr.netAmount) || 0), 0)
                  .toFixed(2)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Trabajador / Cargo</th>
                    <th className="py-3 px-4">Contrato</th>
                    <th className="py-3 px-4 text-right">Sueldo Base</th>
                    <th className="py-3 px-4 text-right">Desc. Adelanto</th>
                    <th className="py-3 px-4 text-right font-black text-slate-900">Neto a Percibir</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.personName}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{item.position}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                          {item.contractType}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-slate-700">
                        {currencySymbol}{Number(item.baseSalary).toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-rose-600">
                        {Number(item.advancesDiscount) > 0 ? `-${currencySymbol}${Number(item.advancesDiscount).toFixed(2)}` : "0.00"}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                        {currencySymbol}{Number(item.netAmount).toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {item.status === "paid" ? "Pagado" : "Pendiente"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenReceipt(item)}
                          className="px-3 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Recibo PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONTENIDO DE TAB 4: ADELANTOS ================= */}
      {activeTab === "advances" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Adelantos y Préstamos de Personal</h3>
              <p className="text-xs text-slate-500">
                Gestión de adelantos con programación de cuotas y descuento automático en nómina
              </p>
            </div>
            <button
              onClick={() => setShowCreateAdvanceModal(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Solicitar Adelanto
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advances.map((adv) => (
              <div
                key={adv.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{adv.personName}</h4>
                    <span className="text-xs text-slate-500 font-medium">{adv.position}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      adv.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : adv.status === "applied"
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : adv.status === "rejected"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {adv.status === "approved"
                      ? "Aprobado (Cobrando)"
                      : adv.status === "applied"
                      ? "Completamente Liquidado"
                      : adv.status === "rejected"
                      ? "Rechazado"
                      : "Pendiente de Aprobación"}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Monto Total:</span>
                    <span className="font-bold text-slate-900">
                      {currencySymbol}{Number(adv.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Saldo Restante:</span>
                    <span className="font-bold text-rose-600">
                      {currencySymbol}{Number(adv.remaining).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Cuotas Programadas:</span>
                    <span className="font-bold text-slate-800">{adv.installments} cuotas</span>
                  </div>
                </div>

                {adv.reason && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                    "{adv.reason}"
                  </p>
                )}

                {/* Acciones de Aprobación */}
                {adv.status === "pending" && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleApproveAdvance(adv.id, "approved")}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleApproveAdvance(adv.id, "rejected")}
                      className="flex-1 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition border border-rose-200"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= CONTENIDO DE TAB 5: PLANTILLAS ================= */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Plantillas y Formatos de Contratos Legales</h3>
              <p className="text-xs text-slate-500">
                Modelos de contratación formal con reemplazo dinámico de variables
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 uppercase">
                      {tpl.contractType}
                    </span>
                    <FileCheck className="w-4 h-4 text-sky-600" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{tpl.name}</h4>
                  <pre className="mt-3 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
                    {tpl.body}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: RECIBO OFICIAL DE NÓMINA ================= */}
      {showReceiptModal && selectedReceiptItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto print:p-0 print:shadow-none">
            {/* Encabezado del Recibo */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-sky-600/30">
                  RM
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase">
                    {condoDetails?.name || "Residencias El Ávila"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprobante Oficial de Pago de Nómina • RRHH
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Datos del Trabajador */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Colaborador</span>
                <span className="font-bold text-slate-900 text-sm">{selectedReceiptItem.personName}</span>
                <span className="text-slate-600 block">
                  Doc: {selectedReceiptItem.personDocType}-{selectedReceiptItem.personDocNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Cargo Desempeñado</span>
                <span className="font-bold text-slate-900 text-sm">{selectedReceiptItem.position}</span>
                <span className="text-slate-600 block">
                  Contrato: <span className="capitalize font-semibold">{selectedReceiptItem.contractType}</span>
                </span>
              </div>
            </div>

            {/* Desglose de Conceptos */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Concepto</th>
                    <th className="py-2.5 px-4 text-right">Asignaciones</th>
                    <th className="py-2.5 px-4 text-right">Deducciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      Sueldo Base Período ({selectedReceiptItem.payFrequency})
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {currencySymbol}{Number(selectedReceiptItem.baseSalary).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-400">—</td>
                  </tr>

                  {Number(selectedReceiptItem.advancesDiscount) > 0 && (
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-rose-700">
                        Amortización de Adelanto de Sueldo Programado
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400">—</td>
                      <td className="py-2.5 px-4 text-right font-bold text-rose-600">
                        -{currencySymbol}{Number(selectedReceiptItem.advancesDiscount).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td className="py-3 px-4 text-slate-900 text-sm">TOTAL NETO LIQUIDADO</td>
                    <td colSpan={2} className="py-3 px-4 text-right text-emerald-700 text-base font-black">
                      {currencySymbol}{Number(selectedReceiptItem.netAmount).toFixed(2)} {selectedReceiptItem.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Firmas */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2">
                <span className="font-bold text-slate-900 block">Administración del Condominio</span>
                <span className="text-slate-500 text-[10px]">Firma y Sello Autorizado</span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span className="font-bold text-slate-900 block">{selectedReceiptItem.personName}</span>
                <span className="text-slate-500 text-[10px]">Firma Conforme del Trabajador</span>
              </div>
            </div>

            {/* Acciones Modal */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold text-xs hover:bg-sky-700 transition flex items-center gap-1.5 shadow-md shadow-sky-600/20"
              >
                <Printer className="w-4 h-4" />
                Imprimir Recibo Oficial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONTRATO DE TRABAJO LEGAL ================= */}
      {showContractModal && contractPreviewData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-sky-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  {contractPreviewData.templateName}
                </h3>
              </div>
              <button
                onClick={() => setShowContractModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl whitespace-pre-wrap font-serif text-sm text-slate-800 leading-relaxed">
              {contractPreviewData.bodyText}
            </div>

            <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
              <div className="border-t border-slate-400 pt-2">
                <span className="font-bold text-slate-900 block">Por el Condominio</span>
                <span className="text-slate-500 text-[10px]">Representante Legal</span>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span className="font-bold text-slate-900 block">{contractPreviewData.worker.personName}</span>
                <span className="text-slate-500 text-[10px]">El Contratado / Trabajador</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowContractModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold text-xs hover:bg-sky-700 transition flex items-center gap-1.5 shadow-md shadow-sky-600/20"
              >
                <Printer className="w-4 h-4" />
                Imprimir Contrato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTRAR TRABAJADOR ================= */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Registrar Nuevo Colaborador</h3>
                  <p className="text-xs text-slate-500">Añadir personal con contrato al condominio</p>
                </div>
              </div>
              <button onClick={() => setShowCreateStaffModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo Doc.</label>
                  <select
                    value={staffForm.personDocType}
                    onChange={(e) => setStaffForm({ ...staffForm, personDocType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="V">V (Venezolano)</option>
                    <option value="E">E (Extranjero)</option>
                    <option value="J">J (Jurídico / RIF)</option>
                    <option value="P">P (Pasaporte)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Cédula o RIF</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: 14285910"
                    value={staffForm.personDocNumber}
                    onChange={(e) => setStaffForm({ ...staffForm, personDocNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo o Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Juan Alberto Pérez"
                  value={staffForm.personFullName}
                  onChange={(e) => setStaffForm({ ...staffForm, personFullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cargo / Puesto</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Conserje, Vigilante"
                    value={staffForm.position}
                    onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Modalidad de Contrato</label>
                  <select
                    value={staffForm.contractType}
                    onChange={(e) => setStaffForm({ ...staffForm, contractType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="individual">Individual (Particular con C.I.)</option>
                    <option value="company">Empresa (Seguridad con RIF)</option>
                    <option value="cooperative">Cooperativa (Jardinería)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sueldo / Honorario ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={staffForm.salary}
                    onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Periodicidad de Pago</label>
                  <select
                    value={staffForm.payFrequency}
                    onChange={(e) => setStaffForm({ ...staffForm, payFrequency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Banco</label>
                  <input
                    type="text"
                    placeholder="ej: Banesco, Mercantil"
                    value={staffForm.bankName}
                    onChange={(e) => setStaffForm({ ...staffForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número de Cuenta</label>
                  <input
                    type="text"
                    placeholder="0105-0000-00-0000000000"
                    value={staffForm.bankAccount}
                    onChange={(e) => setStaffForm({ ...staffForm, bankAccount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Documento Adjunto (URL de Cédula o RIF)</label>
                <input
                  type="text"
                  placeholder="https://minio.../cedula.pdf"
                  value={staffForm.documentUrl}
                  onChange={(e) => setStaffForm({ ...staffForm, documentUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Guardar Trabajador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SOLICITAR ADELANTO ================= */}
      {showCreateAdvanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Solicitar Adelanto de Sueldo</h3>
              </div>
              <button onClick={() => setShowCreateAdvanceModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdvance} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seleccionar Trabajador</label>
                <select
                  required
                  value={advanceForm.staffId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, staffId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="">-- Elige un colaborador --</option>
                  {staffList
                    .filter((s) => s.status === "active")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.personName} ({s.position})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monto Adelanto ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cuotas de Descuento</label>
                  <select
                    value={advanceForm.installments}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, installments: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value={1}>1 cuota (próxima nómina)</option>
                    <option value={2}>2 cuotas</option>
                    <option value={3}>3 cuotas</option>
                    <option value={4}>4 cuotas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo / Justificación</label>
                <textarea
                  rows={2}
                  placeholder="ej: Emergencia médica familiar, útiles escolares..."
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateAdvanceModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Registrar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREAR PERÍODO DE NÓMINA ================= */}
      {showCreatePeriodModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Crear Período de Nómina</h3>
              </div>
              <button onClick={() => setShowCreatePeriodModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    required
                    value={periodForm.startDate}
                    onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Fin</label>
                  <input
                    type="date"
                    required
                    value={periodForm.endDate}
                    onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold block">Cálculo Automático Integrado:</span>
                <p className="text-[11px] leading-relaxed">
                  Al crear el período se calcularán los sueldos correspondientes para todos los trabajadores activos y se programarán los descuentos de adelantos pendientes automáticamente.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreatePeriodModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Generar Nómina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
