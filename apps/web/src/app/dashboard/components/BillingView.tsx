"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  TrendingDown,
  Layers,
  ArrowRightLeft,
  X,
  FileText,
  User,
  Phone,
  Mail,
  Percent,
  Coins,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { fetchApi } from "../../../lib/api";

interface BillingViewProps {
  condoDetails: any;
  structures: any[];
  units: any[];
  currentUser: any;
  notify: (msg: string, isError?: boolean) => void;
}

export function BillingView({
  condoDetails,
  structures,
  units,
  currentUser,
  notify,
}: BillingViewProps) {
  const [activeTab, setActiveTab] = useState<"plans" | "charges" | "morosity" | "currency">("plans");

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Data states
  const [feePlans, setFeePlans] = useState<any[]>([]);
  const [unitCharges, setUnitCharges] = useState<any[]>([]);
  const [morosityData, setMorosityData] = useState<any>(null);
  const [currencyRates, setCurrencyRates] = useState<any[]>([]);

  // Filters
  const currentMonthStr = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonthStr);
  const [chargesStatusFilter, setChargesStatusFilter] = useState("all");
  const [chargesSearch, setChargesSearch] = useState("");
  const [morosityStructureFilter, setMorosityStructureFilter] = useState("all");

  // Modals
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showNewRateModal, setShowNewRateModal] = useState(false);
  const [statementUnit, setStatementUnit] = useState<any | null>(null);
  const [unitStatementData, setUnitStatementData] = useState<any | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  // Forms
  const [newPlanForm, setNewPlanForm] = useState({
    name: "",
    type: "ordinary",
    mode: "fixed",
    amount: "",
    currency: condoDetails?.baseCurrency || "USD",
    appliesTo: "all",
    structureId: "",
    unitId: "",
    taxApplies: true,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    requiresMeeting: false,
    minuteId: "",
  });

  const [generateForm, setGenerateForm] = useState({
    period: currentMonthStr,
    dueDate: `${currentMonthStr}-15`,
  });

  const [newRateForm, setNewRateForm] = useState({
    fromCurrency: condoDetails?.baseCurrency || "USD",
    toCurrency: condoDetails?.foreignCurrency || "VES",
    rate: "",
    source: "Tasa Oficial",
    effectiveDate: new Date().toISOString().slice(0, 10),
  });

  // Simulator
  const [calcAmount, setCalcAmount] = useState<string>("50");

  const condoId = condoDetails?.id;

  // Loaders
  const loadFeePlans = async () => {
    if (!condoId) return;
    try {
      const res = await fetchApi<any[]>(`/fee-plans?condominiumId=${condoId}`);
      setFeePlans(res || []);
    } catch (err: any) {
      notify(err.message || "Error al cargar planes de cuota", true);
    }
  };

  const loadUnitCharges = async () => {
    if (!condoId) return;
    try {
      const query = new URLSearchParams({ condominiumId: condoId });
      if (selectedPeriod) query.append("period", selectedPeriod);
      if (chargesStatusFilter !== "all") query.append("status", chargesStatusFilter);
      const res = await fetchApi<any[]>(`/unit-charges?${query.toString()}`);
      setUnitCharges(res || []);
    } catch (err: any) {
      notify(err.message || "Error al cargar cargos del período", true);
    }
  };

  const loadMorosity = async () => {
    if (!condoId) return;
    try {
      const query = new URLSearchParams({ condominiumId: condoId });
      if (morosityStructureFilter !== "all") query.append("structureId", morosityStructureFilter);
      const res = await fetchApi<any>(`/billing/morosity?${query.toString()}`);
      setMorosityData(res);
    } catch (err: any) {
      notify(err.message || "Error al cargar panel de morosidad", true);
    }
  };

  const loadCurrencyRates = async () => {
    if (!condoId) return;
    try {
      const res = await fetchApi<any[]>(`/currency-rates?condominiumId=${condoId}`);
      setCurrencyRates(res || []);
    } catch (err: any) {
      notify(err.message || "Error al cargar tasas de cambio", true);
    }
  };

  useEffect(() => {
    if (condoId) {
      setLoading(true);
      Promise.all([loadFeePlans(), loadUnitCharges(), loadMorosity(), loadCurrencyRates()]).finally(() => {
        setLoading(false);
      });
    }
  }, [condoId]);

  useEffect(() => {
    if (activeTab === "charges") {
      loadUnitCharges();
    } else if (activeTab === "morosity") {
      loadMorosity();
    }
  }, [selectedPeriod, chargesStatusFilter, morosityStructureFilter, activeTab]);

  // Handle Create Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanForm.name.trim() || !newPlanForm.amount) {
      notify("Nombre y monto son obligatorios", true);
      return;
    }
    setActionLoading(true);
    try {
      const payload: any = {
        condominiumId: condoId,
        name: newPlanForm.name.trim(),
        type: newPlanForm.type,
        mode: newPlanForm.mode,
        amount: parseFloat(newPlanForm.amount),
        currency: newPlanForm.currency || condoDetails?.baseCurrency || "USD",
        appliesTo: newPlanForm.appliesTo,
        taxApplies: newPlanForm.taxApplies,
        startDate: newPlanForm.startDate,
        endDate: newPlanForm.endDate || null,
        requiresMeeting: newPlanForm.requiresMeeting,
        minuteId: newPlanForm.minuteId || null,
      };
      if (newPlanForm.appliesTo === "structure") {
        if (!newPlanForm.structureId) throw new Error("Debe seleccionar una estructura");
        payload.structureId = newPlanForm.structureId;
      }
      if (newPlanForm.appliesTo === "unit") {
        if (!newPlanForm.unitId) throw new Error("Debe seleccionar una unidad");
        payload.unitId = newPlanForm.unitId;
      }

      await fetchApi("/fee-plans", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      notify("Plan de cuota creado exitosamente");
      setShowNewPlanModal(false);
      setNewPlanForm({
        name: "",
        type: "ordinary",
        mode: "fixed",
        amount: "",
        currency: condoDetails?.baseCurrency || "USD",
        appliesTo: "all",
        structureId: "",
        unitId: "",
        taxApplies: true,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: "",
        requiresMeeting: false,
        minuteId: "",
      });
      loadFeePlans();
    } catch (err: any) {
      notify(err.message || "Error al crear plan de cuota", true);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Plan
  const handleCancelPlan = async (id: string, name: string) => {
    if (!confirm(`¿Está seguro de cancelar el plan de cuota "${name}"?`)) return;
    setActionLoading(true);
    try {
      await fetchApi(`/fee-plans/${id}`, { method: "DELETE" });
      notify("Plan de cuota cancelado");
      loadFeePlans();
    } catch (err: any) {
      notify(err.message || "Error al cancelar plan", true);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Generate Monthly Charges
  const handleGenerateCharges = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetchApi<any>("/unit-charges/generate", {
        method: "POST",
        body: JSON.stringify({
          condominiumId: condoId,
          period: generateForm.period,
          dueDate: generateForm.dueDate,
        }),
      });
      notify(
        `Cargos generados: ${res.generatedCount} nuevos (${res.skippedCount} omitidos por ya existir)`
      );
      setShowGenerateModal(false);
      setSelectedPeriod(generateForm.period);
      loadUnitCharges();
      loadMorosity();
    } catch (err: any) {
      notify(err.message || "Error al generar cargos", true);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Apply Mora
  const handleApplyMora = async () => {
    setActionLoading(true);
    try {
      await fetchApi(`/unit-charges/apply-mora?condominiumId=${condoId}`, {
        method: "POST",
      });
      notify("Auditoría de mora aplicada y actualizada");
      loadUnitCharges();
      loadMorosity();
    } catch (err: any) {
      notify(err.message || "Error al recalcular mora", true);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Create Currency Rate
  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRateForm.rate || parseFloat(newRateForm.rate) <= 0) {
      notify("Ingrese una tasa válida mayor a 0", true);
      return;
    }
    setActionLoading(true);
    try {
      await fetchApi("/currency-rates", {
        method: "POST",
        body: JSON.stringify({
          condominiumId: condoId,
          fromCurrency: newRateForm.fromCurrency,
          toCurrency: newRateForm.toCurrency,
          rate: parseFloat(newRateForm.rate),
          source: newRateForm.source,
          effectiveDate: newRateForm.effectiveDate,
        }),
      });
      notify("Tasa de cambio registrada exitosamente");
      setShowNewRateModal(false);
      setNewRateForm({
        fromCurrency: condoDetails?.baseCurrency || "USD",
        toCurrency: condoDetails?.foreignCurrency || "VES",
        rate: "",
        source: "Tasa Oficial",
        effectiveDate: new Date().toISOString().slice(0, 10),
      });
      loadCurrencyRates();
    } catch (err: any) {
      notify(err.message || "Error al registrar tasa de cambio", true);
    } finally {
      setActionLoading(false);
    }
  };

  // View Statement Modal
  const openUnitStatement = async (unitId: string, unitCode: string) => {
    setStatementUnit({ id: unitId, code: unitCode });
    setStatementLoading(true);
    try {
      const res = await fetchApi<any>(`/units/${unitId}/statement`);
      setUnitStatementData(res);
    } catch (err: any) {
      notify(err.message || "Error al cargar estado de cuenta", true);
    } finally {
      setStatementLoading(false);
    }
  };

  // Filtered unit charges
  const filteredCharges = unitCharges.filter((item) => {
    if (!chargesSearch) return true;
    const q = chargesSearch.toLowerCase();
    return (
      item.unitCode?.toLowerCase().includes(q) ||
      item.structureName?.toLowerCase().includes(q) ||
      item.feePlanName?.toLowerCase().includes(q)
    );
  });

  // Latest Rate
  const latestRate = currencyRates[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner - Exact styling matching ResidentsOwnersView */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-md border border-indigo-400/30">
              <Receipt className="w-3.5 h-3.5" />
              <span>Fase 4: Cobranza y Motor Financiero</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Cobranza, Cuotas y Facturación
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Configura planes de cuotas ordinarias y extraordinarias, emite recibos mensuales para las unidades,
              aplica mora automática sobre saldos vencidos y gestiona tipos de cambio multimoneda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                loadFeePlans();
                loadUnitCharges();
                loadMorosity();
                loadCurrencyRates();
              }}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition backdrop-blur-md border border-white/20 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </button>

            {activeTab === "plans" && (
              <button
                onClick={() => setShowNewPlanModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Cuota</span>
              </button>
            )}

            {activeTab === "charges" && (
              <>
                <button
                  onClick={handleApplyMora}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-medium text-xs md:text-sm flex items-center gap-2 transition backdrop-blur-md border border-amber-400/30 cursor-pointer"
                  title="Auditar cargos vencidos y aplicar mora según reglas del condominio"
                >
                  <Percent className="w-4 h-4" />
                  <span>Recalcular Mora</span>
                </button>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Emitir Cargos</span>
                </button>
              </>
            )}

            {activeTab === "currency" && (
              <button
                onClick={() => setShowNewRateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Tasa</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs - Exact pill style matching SettingsView & ResidentsOwnersView */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200/80 flex flex-wrap gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("plans")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "plans"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Planes de Cuota ({feePlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("charges")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "charges"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Emisión y Cargos Mensuales</span>
        </button>

        <button
          onClick={() => setActiveTab("morosity")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer relative ${
            activeTab === "morosity"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Panel de Morosidad</span>
          {morosityData?.totalDebtorUnits > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white ml-1">
              {morosityData.totalDebtorUnits}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("currency")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "currency"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Multimoneda y Tasas</span>
        </button>
      </div>

      {/* TAB 1: FEE PLANS */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          {/* Info callout matching SettingsView */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-800">
                Modo de cuota ordinaria:
              </span>
              <span className="capitalize font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">
                {condoDetails?.ordinaryFeeMode || "Fija"}
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-slate-800">Impuestos:</span>
              <span className="text-slate-700">
                {condoDetails?.taxExempt
                  ? "Exento de impuestos"
                  : `${condoDetails?.taxRate || 0}% (${condoDetails?.taxIncludedInFee ? "Incluido en cuota" : "Agregado"})`}
              </span>
            </div>
            <div className="text-slate-500 font-medium">
              Mora: {condoDetails?.moraType === "percentage" ? `${condoDetails?.moraValue || 0}%` : `${condoDetails?.moraValue || 0} fijo`}
            </div>
          </div>

          {feePlans.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                <Receipt className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">No hay planes de cuota creados</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Crea una cuota ordinaria de mantenimiento o cuotas extraordinarias para comenzar a emitir cargos mensuales a las unidades residenciales.
                </p>
              </div>
              <button
                onClick={() => setShowNewPlanModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-white font-semibold text-xs transition cursor-pointer"
              >
                + Crear Primera Cuota
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feePlans.map((item) => {
                const plan = item.feePlan;
                const isCancelled = plan.status === "cancelled";
                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-3xl p-6 border shadow-xs space-y-4 transition ${
                      isCancelled
                        ? "border-slate-200 opacity-60 bg-slate-50/50"
                        : "border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider mb-1.5 border ${
                            plan.type === "ordinary"
                              ? "bg-slate-100 text-slate-700 border-slate-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}
                        >
                          {plan.type === "ordinary" ? "Ordinaria" : "Extraordinaria"}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                      </div>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                          isCancelled
                            ? "bg-slate-100 text-slate-500 border-slate-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {isCancelled ? "Cancelada" : "Activa"}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5 py-1">
                      <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                        {plan.currency} {Number(plan.amount).toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">/ mes</span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Alcance:</span>
                        <span className="font-semibold text-slate-800">
                          {plan.appliesTo === "all"
                            ? "Todas las unidades"
                            : plan.appliesTo === "structure"
                            ? `Estructura: ${item.structureName || "Específica"}`
                            : `Unidad: ${item.unitCode || "Específica"}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Impuestos:</span>
                        <span className="font-semibold text-slate-800">
                          {plan.taxApplies ? "Aplica IVA" : "Exento"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vigencia desde:</span>
                        <span className="font-semibold text-slate-800 font-mono">{plan.startDate}</span>
                      </div>
                      {plan.requiresMeeting && (
                        <div className="flex justify-between text-indigo-700 font-medium">
                          <span>Aprobada en asamblea:</span>
                          <span className="font-bold">Sí (Con Acta)</span>
                        </div>
                      )}
                    </div>

                    {!isCancelled && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => handleCancelPlan(plan.id, plan.name)}
                          className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                        >
                          Cancelar Cuota
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CHARGES & MONTHLY EMISSION */}
      {activeTab === "charges" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Período:
                </label>
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Estado:
                </label>
                <select
                  value={chargesStatusFilter}
                  onChange={(e) => setChargesStatusFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="overdue">Vencidos (Con Mora)</option>
                  <option value="paid">Pagados</option>
                </select>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por unidad o torre..."
                value={chargesSearch}
                onChange={(e) => setChargesSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Charges Table */}
          {filteredCharges.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                <Receipt className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">
                  No hay cargos emitidos para {selectedPeriod}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Haz clic en "Emitir Cargos" para generar los recibos y cuotas mensuales para todas las unidades activas.
                </p>
              </div>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-white font-semibold text-xs transition cursor-pointer"
              >
                ⚡ Emitir Cargos Ahora
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 text-xs">
                    <tr>
                      <th className="px-5 py-3.5">Unidad / Estructura</th>
                      <th className="px-5 py-3.5">Concepto</th>
                      <th className="px-5 py-3.5 font-mono">Base</th>
                      <th className="px-5 py-3.5 font-mono">IVA</th>
                      <th className="px-5 py-3.5 font-mono">Mora</th>
                      <th className="px-5 py-3.5 font-mono font-bold text-slate-900">Total</th>
                      <th className="px-5 py-3.5">Vencimiento</th>
                      <th className="px-5 py-3.5 text-center">Estado</th>
                      <th className="px-5 py-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCharges.map((item) => {
                      const c = item.charge;
                      const isOverdue = c.status === "overdue";
                      const isPaid = c.status === "paid";
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span>{item.unitCode}</span>
                              <span className="text-xs text-slate-400 font-normal">({item.structureName})</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-700 font-medium">
                            {item.feePlanName}
                          </td>
                          <td className="px-5 py-4 text-slate-600 font-mono">
                            {c.currency} {Number(c.amountBase).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 text-slate-600 font-mono">
                            {c.currency} {Number(c.taxAmount).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 font-mono font-semibold text-amber-600">
                            {Number(c.moraAmount) > 0 ? `+${c.currency} ${Number(c.moraAmount).toFixed(2)}` : "-"}
                          </td>
                          <td className="px-5 py-4 font-mono font-extrabold text-slate-900">
                            {c.currency} {Number(c.totalAmount).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500 font-mono">{c.dueDate}</td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                isPaid
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isOverdue
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {isPaid ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : isOverdue ? (
                                <AlertCircle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              {isPaid ? "Pagado" : isOverdue ? "Vencido" : "Pendiente"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => openUnitStatement(c.unitId, item.unitCode)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                            >
                              Estado de Cuenta
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MOROSITY PANEL */}
      {activeTab === "morosity" && (
        <div className="space-y-4">
          {/* KPI Summary Cards - Homogeneous with dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Unidades Deudoras
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {morosityData?.totalDebtorUnits || 0}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Deuda Total Vencida
                </span>
                <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
                  {condoDetails?.baseCurrency || "USD"} {morosityData?.totalArrears || "0.00"}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Mora Acumulada
                </span>
                <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
                  {condoDetails?.baseCurrency || "USD"} {morosityData?.totalMora || "0.00"}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                <Percent className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Structure Filter & Refresh Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">
                Filtrar por Estructura:
              </span>
              <select
                value={morosityStructureFilter}
                onChange={(e) => setMorosityStructureFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="all">Todas las torres y bloques</option>
                {structures.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.kind})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleApplyMora}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recalcular Mora Ahora</span>
            </button>
          </div>

          {/* Debtors Grid */}
          {!morosityData?.debtors || morosityData.debtors.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">¡Al día! Sin morosidad registrada</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Todas las unidades se encuentran solventes con respecto a sus cuotas y fechas de vencimiento.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {morosityData.debtors.map((d: any) => (
                <div
                  key={d.unitId}
                  className="bg-white rounded-3xl border border-rose-100 p-6 shadow-xs space-y-4 hover:border-rose-200 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <h4 className="text-base font-bold text-slate-900">
                          Unidad {d.unitCode}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{d.structureName}</span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {d.overdueChargesCount} cuota(s)
                    </span>
                  </div>

                  <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-100">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-600 font-medium">Total Adeudado:</span>
                      <span className="text-xl font-black text-rose-600 font-mono">
                        {d.currency} {d.totalDebt}
                      </span>
                    </div>
                    {Number(d.totalMora) > 0 && (
                      <div className="flex justify-between text-xs text-amber-700 mt-1">
                        <span>Mora por atraso:</span>
                        <span className="font-bold font-mono">+{d.currency} {d.totalMora}</span>
                      </div>
                    )}
                  </div>

                  {/* Owner contact */}
                  <div className="text-xs space-y-1 text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{d.owner?.fullName || "Sin titular asignado"}</span>
                    </div>
                    {d.owner?.phone && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.owner.phone}</span>
                      </div>
                    )}
                    {d.owner?.email && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.owner.email}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openUnitStatement(d.unitId, d.unitCode)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#1e293b] text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Ver Estado de Cuenta
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CURRENCY RATES & CONVERSION */}
      {activeTab === "currency" && (
        <div className="space-y-6">
          {/* Rate Converter Widget - White card matching SettingsView */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Simulador de Conversión Multimoneda
              </span>
              <h3 className="text-xl font-bold text-slate-900">Conversión en Vivo</h3>
              <p className="text-xs text-slate-500 max-w-md">
                Tasa vigente para {condoDetails?.name || "el condominio"}:{" "}
                <strong className="text-indigo-600 font-mono">
                  {latestRate ? `1 ${latestRate.fromCurrency} = ${Number(latestRate.rate).toFixed(4)} ${latestRate.toCurrency}` : "No registrada"}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Monto en {condoDetails?.baseCurrency || "USD"}:
                </label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="px-3.5 py-2 bg-white rounded-xl text-base font-bold text-slate-900 w-28 text-center border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <ArrowRightLeft className="w-5 h-5 text-slate-400 mt-4" />

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Equivalente en {latestRate?.toCurrency || "VES"}:
                </label>
                <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-base font-black text-emerald-700 font-mono">
                  {latestRate
                    ? (parseFloat(calcAmount || "0") * parseFloat(latestRate.rate)).toFixed(2)
                    : "0.00"}
                </div>
              </div>
            </div>
          </div>

          {/* Rates History Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Historial de Tasas de Cambio</h3>
                <p className="text-xs text-slate-500">Tasas oficiales registradas para la conversión automática de pagos</p>
              </div>
              <button
                onClick={() => setShowNewRateModal(true)}
                className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                + Nueva Tasa
              </button>
            </div>

            {currencyRates.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No hay tasas registradas. Haz clic en "+ Nueva Tasa" para registrar el tipo de cambio oficial.
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 text-xs">
                  <tr>
                    <th className="px-5 py-3.5">Par de Monedas</th>
                    <th className="px-5 py-3.5 font-mono">Tasa de Cambio</th>
                    <th className="px-5 py-3.5">Fecha de Vigencia</th>
                    <th className="px-5 py-3.5">Fuente</th>
                    <th className="px-5 py-3.5">Fecha de Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currencyRates.map((r, i) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {r.fromCurrency} ➔ {r.toCurrency}
                        {i === 0 && (
                          <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            VIGENTE
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">
                        {Number(r.rate).toFixed(6)}
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs font-mono">
                        {r.effectiveDate}
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs">
                        {r.source || "Manual"}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Create Fee Plan */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Nuevo Plan de Cuota</h3>
                  <p className="text-xs text-slate-400">Define los parámetros de cobro ordinario o extraordinario</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewPlanModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre de la Cuota *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Mantenimiento Ordinario, Fondo de Reserva..."
                  value={newPlanForm.name}
                  onChange={(e) => setNewPlanForm({ ...newPlanForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tipo de Cuota *
                  </label>
                  <select
                    value={newPlanForm.type}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  >
                    <option value="ordinary">Ordinaria</option>
                    <option value="extraordinary">Extraordinaria</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Modalidad *
                  </label>
                  <select
                    value={newPlanForm.mode}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, mode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  >
                    <option value="fixed">Fija (Mismo monto)</option>
                    <option value="variable">Variable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monto Base *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newPlanForm.amount}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Moneda *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlanForm.currency}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs uppercase font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alcance de la Cuota *
                </label>
                <select
                  value={newPlanForm.appliesTo}
                  onChange={(e) => setNewPlanForm({ ...newPlanForm, appliesTo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                >
                  <option value="all">Todas las unidades del condominio</option>
                  <option value="structure">Estructura específica (Torre / Bloque)</option>
                  <option value="unit">Unidad específica</option>
                </select>
              </div>

              {newPlanForm.appliesTo === "structure" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Seleccionar Estructura *
                  </label>
                  <select
                    value={newPlanForm.structureId}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, structureId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  >
                    <option value="">Seleccione una torre o bloque...</option>
                    {structures.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.kind})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newPlanForm.appliesTo === "unit" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Seleccionar Unidad *
                  </label>
                  <select
                    value={newPlanForm.unitId}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, unitId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  >
                    <option value="">Seleccione una unidad...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        Unidad {u.code} ({u.structureName || "General"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={newPlanForm.startDate}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fecha Fin (Opcional)
                  </label>
                  <input
                    type="date"
                    value={newPlanForm.endDate}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="taxAppliesCheck"
                  checked={newPlanForm.taxApplies}
                  onChange={(e) => setNewPlanForm({ ...newPlanForm, taxApplies: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="taxAppliesCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Aplica impuestos según configuración del condominio
                </label>
              </div>

              {newPlanForm.type === "extraordinary" && (
                <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requiresMeetingCheck"
                      checked={newPlanForm.requiresMeeting}
                      onChange={(e) => setNewPlanForm({ ...newPlanForm, requiresMeeting: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="requiresMeetingCheck" className="text-xs font-bold text-indigo-900 cursor-pointer">
                      Aprobada formalmente mediante Acta o Asamblea
                    </label>
                  </div>
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    Por políticas del condominio (BR-003), las cuotas extraordinarias requieren acta emitida o aprobación en asamblea.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  {actionLoading ? "Guardando..." : "Crear Cuota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Generate Charges */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Emitir Cargos del Mes</h3>
                  <p className="text-xs text-slate-400">Genera las cuotas mensuales para todas las unidades</p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Esta acción generará los recibos y cuotas del período seleccionado para todas las unidades del condominio. Es idempotente (no duplica si ya fue emitido).
            </p>

            <form onSubmit={handleGenerateCharges} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Período a Facturar (YYYY-MM) *
                </label>
                <input
                  type="month"
                  required
                  value={generateForm.period}
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      period: e.target.value,
                      dueDate: `${e.target.value}-15`,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  required
                  value={generateForm.dueDate}
                  onChange={(e) => setGenerateForm({ ...generateForm, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  {actionLoading ? "Emitiendo..." : "⚡ Emitir Cargos Ahora"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: New Currency Rate */}
      {showNewRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Registrar Tipo de Cambio</h3>
                  <p className="text-xs text-slate-400">Actualiza la tasa oficial multimoneda</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewRateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    De Moneda *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRateForm.fromCurrency}
                    onChange={(e) => setNewRateForm({ ...newRateForm, fromCurrency: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    A Moneda *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRateForm.toCurrency}
                    onChange={(e) => setNewRateForm({ ...newRateForm, toCurrency: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tasa de Cambio (1 {newRateForm.fromCurrency} = ...) *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  placeholder="ej: 42.500000"
                  value={newRateForm.rate}
                  onChange={(e) => setNewRateForm({ ...newRateForm, rate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fecha de Vigencia *
                  </label>
                  <input
                    type="date"
                    required
                    value={newRateForm.effectiveDate}
                    onChange={(e) => setNewRateForm({ ...newRateForm, effectiveDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fuente / Referencia
                  </label>
                  <input
                    type="text"
                    placeholder="ej: BCV, Oficial..."
                    value={newRateForm.source}
                    onChange={(e) => setNewRateForm({ ...newRateForm, source: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewRateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  {actionLoading ? "Guardando..." : "Registrar Tasa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Unit Statement of Account */}
      {statementUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Estado de Cuenta — Unidad {statementUnit.code}
                  </h3>
                  <p className="text-xs text-slate-400">Histórico consolidado de cuotas, mora y saldos</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStatementUnit(null);
                  setUnitStatementData(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statementLoading ? (
              <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Cargando estado de cuenta...</span>
              </div>
            ) : unitStatementData ? (
              <div className="space-y-4">
                {/* Summary KPIs */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Saldo Adeudado
                    </span>
                    <div className="text-xl font-black text-rose-600 font-mono mt-0.5">
                      {condoDetails?.baseCurrency || "USD"} {unitStatementData.summary.totalDebt}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Mora por Atraso
                    </span>
                    <div className="text-xl font-black text-amber-600 font-mono mt-0.5">
                      {condoDetails?.baseCurrency || "USD"} {unitStatementData.summary.totalMora}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Total Pagado
                    </span>
                    <div className="text-xl font-black text-emerald-600 font-mono mt-0.5">
                      {condoDetails?.baseCurrency || "USD"} {unitStatementData.summary.totalPaid}
                    </div>
                  </div>
                </div>

                {/* Owner info */}
                {unitStatementData.owner && (
                  <div className="text-xs bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-700">
                    <div>
                      <span className="font-bold text-slate-900">
                        Propietario Titular:
                      </span>{" "}
                      {unitStatementData.owner.fullName} ({unitStatementData.owner.documentType}-
                      {unitStatementData.owner.documentNumber})
                    </div>
                    <div className="text-slate-500">{unitStatementData.owner.phone || unitStatementData.owner.email}</div>
                  </div>
                )}

                {/* Charges List */}
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 text-xs">
                      <tr>
                        <th className="py-3 px-3.5">Período</th>
                        <th className="py-3 px-3.5">Concepto</th>
                        <th className="py-3 px-3.5 font-mono">Base</th>
                        <th className="py-3 px-3.5 font-mono">IVA</th>
                        <th className="py-3 px-3.5 font-mono">Mora</th>
                        <th className="py-3 px-3.5 font-mono font-bold text-slate-900">Total</th>
                        <th className="py-3 px-3.5 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unitStatementData.charges.map((item: any) => {
                        const c = item.charge;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800">{c.period}</td>
                            <td className="py-2.5 px-3.5 text-slate-700 font-medium">{item.feePlanName}</td>
                            <td className="py-2.5 px-3.5 font-mono text-slate-600">{Number(c.amountBase).toFixed(2)}</td>
                            <td className="py-2.5 px-3.5 font-mono text-slate-600">{Number(c.taxAmount).toFixed(2)}</td>
                            <td className="py-2.5 px-3.5 font-mono text-amber-600 font-bold">
                              {Number(c.moraAmount) > 0 ? `+${Number(c.moraAmount).toFixed(2)}` : "-"}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono font-extrabold text-slate-900">{Number(c.totalAmount).toFixed(2)}</td>
                            <td className="py-2.5 px-3.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  c.status === "paid"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : c.status === "overdue"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
