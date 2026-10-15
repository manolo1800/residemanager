"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  DollarSign,
  Building2,
  Calendar,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Upload,
  User,
  ShieldAlert,
  ArrowUpRight,
  Receipt,
  FileCheck,
  X,
  Phone,
  Hash,
} from "lucide-react";
import { fetchApi } from "../../../lib/api";
import { OfficialReceiptModal } from "./OfficialReceiptModal";

interface PaymentsManagementViewProps {
  condoDetails: any;
  units: any[];
  currentUser: any;
  notify: (msg: string, isError?: boolean) => void;
}

export function PaymentsManagementView({
  condoDetails,
  units,
  currentUser,
  notify,
}: PaymentsManagementViewProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "pending_data" | "approved" | "rejected"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // Modals state
  const [showAssistedPaymentModal, setShowAssistedPaymentModal] = useState(false);
  const [showMethodsModal, setShowMethodsModal] = useState(false);
  const [showReceiptViewerModal, setShowReceiptViewerModal] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  // Complete data modal state
  const [showCompleteDataModal, setShowCompleteDataModal] = useState(false);
  const [selectedPaymentToComplete, setSelectedPaymentToComplete] = useState<any | null>(null);
  const [completeDataForm, setCompleteDataForm] = useState({
    methodId: "",
    referenceNumber: "",
    phoneFrom: "",
    receiptFileUrl: "",
    reviewNotes: "",
  });

  // Reject payment modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPaymentToReject, setSelectedPaymentToReject] = useState<any | null>(null);
  const [rejectForm, setRejectForm] = useState({ reason: "", notes: "" });

  // Official Receipt Modal state
  const [showOfficialReceiptModal, setShowOfficialReceiptModal] = useState(false);
  const [currentReceiptData, setCurrentReceiptData] = useState<any | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  // Form state for Admin Assisted Payment
  const [assistedForm, setAssistedForm] = useState({
    unitId: "",
    amount: "",
    currency: "USD",
    exchangeRate: "",
    methodId: "",
    referenceNumber: "",
    paymentDate: new Date().toISOString().split("T")[0],
    phoneFrom: "",
    isApprovedPendingData: false,
    pendingDataReason: "",
    reviewNotes: "",
    receiptFileUrl: "",
    receiptFileName: "",
    receiptFileType: "",
    selectedChargeIds: [] as string[],
  });
  const [unitPendingCharges, setUnitPendingCharges] = useState<any[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(false);

  // Form state for New Payment Method
  const [newMethodForm, setNewMethodForm] = useState({
    name: "",
    type: "transfer",
    bankName: "",
    accountNumber: "",
    holderName: "",
    holderId: "",
    phone: "",
    email: "",
    notes: "",
    requiresReference: true,
    requiresPhone: false,
    isActive: true,
  });

  // Load Payments & Methods
  const loadData = async () => {
    if (!condoDetails?.id) return;
    try {
      setLoading(true);
      const [payments, methods] = await Promise.all([
        fetchApi<any[]>(`/payments?condominiumId=${condoDetails.id}`),
        fetchApi<any[]>(`/payment-methods?condominiumId=${condoDetails.id}`),
      ]);
      setPaymentsList(payments || []);
      setPaymentMethods(methods || []);
    } catch (err: any) {
      console.error("Error loading payments data:", err);
      notify(err.message || "Error al cargar la lista de pagos", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [condoDetails?.id]);

  // When admin selects a unit in assisted payment modal, fetch its pending charges
  const handleUnitChange = async (unitId: string) => {
    setAssistedForm((prev) => ({
      ...prev,
      unitId,
      selectedChargeIds: [],
    }));

    if (!unitId) {
      setUnitPendingCharges([]);
      return;
    }

    try {
      setLoadingCharges(true);
      const res = await fetchApi<any>(`/units/${unitId}/statement`);
      const charges = res?.charges || [];
      const pending = charges.filter(
        (c: any) => c.status === "pending" || c.status === "partially_paid" || c.status === "overdue"
      );
      setUnitPendingCharges(pending);

      // Default amount to sum of pending charges or first charge
      if (pending.length > 0) {
        const sum = pending.reduce(
          (acc: number, cur: any) =>
            acc + (parseFloat(cur.totalAmount) - parseFloat(cur.paidAmount || "0")),
          0
        );
        setAssistedForm((prev) => ({
          ...prev,
          amount: sum.toFixed(2),
          selectedChargeIds: pending.map((c: any) => c.id),
        }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingCharges(false);
    }
  };

  // Handle Receipt Upload (convert to base64 Data URL)
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: "assisted" | "complete") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (target === "assisted") {
        setAssistedForm((prev) => ({
          ...prev,
          receiptFileUrl: result,
          receiptFileName: file.name,
          receiptFileType: file.type || "image/jpeg",
        }));
      } else {
        setCompleteDataForm((prev) => ({
          ...prev,
          receiptFileUrl: result,
        }));
      }
      notify(`Archivo "${file.name}" cargado exitosamente.`);
    };
    reader.readAsDataURL(file);
  };

  // Submit Admin Assisted Payment
  const handleCreateAssistedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistedForm.unitId) {
      notify("Debe seleccionar una unidad residencial", true);
      return;
    }
    if (!assistedForm.amount || parseFloat(assistedForm.amount) <= 0) {
      notify("El monto debe ser mayor a cero", true);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        condominiumId: condoDetails.id,
        unitId: assistedForm.unitId,
        methodId: assistedForm.methodId || null,
        amount: assistedForm.amount,
        currency: assistedForm.currency,
        exchangeRate: assistedForm.exchangeRate ? assistedForm.exchangeRate : null,
        referenceNumber: assistedForm.referenceNumber || null,
        paymentDate: assistedForm.paymentDate,
        phoneFrom: assistedForm.phoneFrom || null,
        chargeIds: assistedForm.selectedChargeIds,
        isApprovedPendingData: assistedForm.isApprovedPendingData,
        pendingDataReason: assistedForm.pendingDataReason || null,
        reviewNotes: assistedForm.reviewNotes || null,
        receiptFileUrl: assistedForm.receiptFileUrl || null,
        receiptFileName: assistedForm.receiptFileName || null,
        receiptFileType: assistedForm.receiptFileType || null,
      };

      const res = await fetchApi<any>("/payments/admin", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      notify(res?.message || "Pago registrado exitosamente");
      setShowAssistedPaymentModal(false);
      // Reset form
      setAssistedForm({
        unitId: "",
        amount: "",
        currency: "USD",
        exchangeRate: "",
        methodId: "",
        referenceNumber: "",
        paymentDate: new Date().toISOString().split("T")[0],
        phoneFrom: "",
        isApprovedPendingData: false,
        pendingDataReason: "",
        reviewNotes: "",
        receiptFileUrl: "",
        receiptFileName: "",
        receiptFileType: "",
        selectedChargeIds: [],
      });
      loadData();
    } catch (err: any) {
      notify(err.message || "Error al registrar el pago", true);
    } finally {
      setLoading(false);
    }
  };

  // Approve Payment
  const handleApprovePayment = async (paymentId: string) => {
    if (!window.confirm("¿Confirmar aprobación de este pago? Se aplicará el saldo a las cuotas correspondientes.")) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetchApi<any>(`/payments/${paymentId}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ reviewNotes: "Aprobado por administración" }),
      });
      notify(res?.message || "Pago aprobado exitosamente");
      loadData();
    } catch (err: any) {
      notify(err.message || "Error al aprobar pago", true);
    } finally {
      setLoading(false);
    }
  };

  // Reject Payment
  const handleRejectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentToReject) return;
    if (!rejectForm.reason) {
      notify("Debe especificar el motivo de rechazo", true);
      return;
    }

    try {
      setLoading(true);
      const res = await fetchApi<any>(`/payments/${selectedPaymentToReject.id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({
          reason: rejectForm.reason,
          reviewNotes: rejectForm.notes,
        }),
      });
      notify(res?.message || "Pago rechazado exitosamente");
      setShowRejectModal(false);
      setSelectedPaymentToReject(null);
      setRejectForm({ reason: "", notes: "" });
      loadData();
    } catch (err: any) {
      notify(err.message || "Error al rechazar pago", true);
    } finally {
      setLoading(false);
    }
  };

  // Complete Pending Data
  const handleCompleteDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentToComplete) return;

    try {
      setLoading(true);
      const res = await fetchApi<any>(
        `/payments/${selectedPaymentToComplete.id}/complete-data`,
        {
          method: "PATCH",
          body: JSON.stringify({
            methodId: completeDataForm.methodId || null,
            referenceNumber: completeDataForm.referenceNumber || null,
            phoneFrom: completeDataForm.phoneFrom || null,
            receiptFileUrl: completeDataForm.receiptFileUrl || null,
            reviewNotes: completeDataForm.reviewNotes || null,
          }),
        }
      );
      notify(res?.message || "Datos completados exitosamente");
      setShowCompleteDataModal(false);
      setSelectedPaymentToComplete(null);
      setCompleteDataForm({
        methodId: "",
        referenceNumber: "",
        phoneFrom: "",
        receiptFileUrl: "",
        reviewNotes: "",
      });
      loadData();
    } catch (err: any) {
      notify(err.message || "Error al completar datos", true);
    } finally {
      setLoading(false);
    }
  };

  // View Official Receipt
  const handleViewOfficialReceipt = async (paymentId: string) => {
    try {
      setReceiptLoading(true);
      const data = await fetchApi<any>(`/payments/${paymentId}/receipt`);
      setCurrentReceiptData(data);
      setShowOfficialReceiptModal(true);
    } catch (err: any) {
      notify(err.message || "Error al generar comprobante de recibo", true);
    } finally {
      setReceiptLoading(false);
    }
  };

  // Create Payment Method
  const handleCreatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodForm.name) {
      notify("Ingrese el nombre del medio de pago", true);
      return;
    }

    try {
      setLoading(true);
      const details: Record<string, any> = {
        notes: newMethodForm.notes,
      };
      if (newMethodForm.bankName) details.bankName = newMethodForm.bankName;
      if (newMethodForm.accountNumber) details.accountNumber = newMethodForm.accountNumber;
      if (newMethodForm.holderName) details.holderName = newMethodForm.holderName;
      if (newMethodForm.holderId) details.holderId = newMethodForm.holderId;
      if (newMethodForm.phone) details.phone = newMethodForm.phone;
      if (newMethodForm.email) details.email = newMethodForm.email;

      await fetchApi<any>("/payment-methods", {
        method: "POST",
        body: JSON.stringify({
          condominiumId: condoDetails.id,
          name: newMethodForm.name,
          type: newMethodForm.type,
          details,
          requiresReference: newMethodForm.requiresReference,
          requiresPhone: newMethodForm.requiresPhone,
          isActive: newMethodForm.isActive,
        }),
      });

      notify("Medio de pago registrado correctamente");
      setNewMethodForm({
        name: "",
        type: "transfer",
        bankName: "",
        accountNumber: "",
        holderName: "",
        holderId: "",
        phone: "",
        email: "",
        notes: "",
        requiresReference: true,
        requiresPhone: false,
        isActive: true,
      });
      loadData();
    } catch (err: any) {
      notify(err.message || "Error al crear medio de pago", true);
    } finally {
      setLoading(false);
    }
  };

  // Toggle method active status
  const handleToggleMethodActive = async (method: any) => {
    try {
      await fetchApi<any>(`/payment-methods/${method.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !method.isActive }),
      });
      notify(`Medio de pago ${!method.isActive ? "activado" : "desactivado"}`);
      loadData();
    } catch (err: any) {
      notify(err.message || "Error al actualizar medio de pago", true);
    }
  };

  // Computed filtered list
  const filteredPayments = paymentsList.filter((p) => {
    // Filter by tab
    if (activeTab === "pending" && p.status !== "pending") return false;
    if (activeTab === "pending_data" && p.status !== "approved_pending_data") return false;
    if (activeTab === "approved" && p.status !== "approved") return false;
    if (activeTab === "rejected" && p.status !== "rejected") return false;

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchRef = p.referenceNumber?.toLowerCase().includes(q);
      const matchUnit = p.unitCode?.toLowerCase().includes(q);
      const matchPhone = p.phoneFrom?.toLowerCase().includes(q);
      const matchMethod = p.methodName?.toLowerCase().includes(q);
      return matchRef || matchUnit || matchPhone || matchMethod;
    }

    return true;
  });

  // KPI Calculations
  const totalApprovedAmount = paymentsList
    .filter((p) => p.status === "approved" || p.status === "approved_pending_data")
    .reduce((acc, p) => acc + parseFloat(p.amount || "0"), 0);

  const pendingApprovalCount = paymentsList.filter((p) => p.status === "pending").length;
  const pendingDataCount = paymentsList.filter(
    (p) => p.status === "approved_pending_data"
  ).length;
  const approvedCount = paymentsList.filter((p) => p.status === "approved").length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ================= HEADER & KPI HERO ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">
                Gestión de Pagos y Recibos
              </h2>
              <p className="text-xs text-white/80">
                Fase 5 • Conciliación offline, pagos asistidos por admin, aprobación y recibos oficiales.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowMethodsModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition cursor-pointer shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-sky-300" />
            <span>Medios de Pago ({paymentMethods.length})</span>
          </button>

          <button
            onClick={() => setShowAssistedPaymentModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Pago Asistido</span>
          </button>
        </div>
      </div>

      {/* ================= METRIC KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recaudado Total */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Recaudación Confirmada</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ${totalApprovedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {approvedCount + pendingDataCount} pagos procesados
          </p>
        </div>

        {/* Pendientes de Aprobación */}
        <div
          onClick={() => setActiveTab("pending")}
          className={`p-5 rounded-3xl border transition cursor-pointer shadow-sm space-y-2 ${
            activeTab === "pending"
              ? "bg-amber-500/20 border-amber-400"
              : "bg-white/80 border-slate-200/80 hover:bg-amber-50/50"
          }`}
        >
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Por Aprobar</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {pendingApprovalCount}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Comprobantes subidos por residentes
          </p>
        </div>

        {/* Pendientes de Datos (RF-M07-013) */}
        <div
          onClick={() => setActiveTab("pending_data")}
          className={`p-5 rounded-3xl border transition cursor-pointer shadow-sm space-y-2 ${
            activeTab === "pending_data"
              ? "bg-rose-500/20 border-rose-400"
              : "bg-white/80 border-slate-200/80 hover:bg-rose-50/50"
          }`}
        >
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-bold uppercase tracking-wider">Pendientes de Datos</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {pendingDataCount}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Falta comprobante o referencia bancaria
          </p>
        </div>

        {/* Aprobados Definitivos */}
        <div
          onClick={() => setActiveTab("approved")}
          className={`p-5 rounded-3xl border transition cursor-pointer shadow-sm space-y-2 ${
            activeTab === "approved"
              ? "bg-emerald-500/20 border-emerald-400"
              : "bg-white/80 border-slate-200/80 hover:bg-emerald-50/50"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Aprobados Definitivos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {approvedCount}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Con recibo oficial y cargos saldados
          </p>
        </div>
      </div>

      {/* ================= CONTROLS & FILTER TABS ================= */}
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Todos ({paymentsList.length})
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === "pending"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-amber-800 hover:bg-amber-100/60"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Por Revisar ({pendingApprovalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("pending_data")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === "pending_data"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-rose-700 hover:bg-rose-100/60"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>⚠️ Pendientes de Datos ({pendingDataCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === "approved"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-800 hover:bg-emerald-100/60"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aprobados ({approvedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === "rejected"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Rechazados ({paymentsList.filter((p) => p.status === "rejected").length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por referencia, unidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium"
          />
        </div>
      </div>

      {/* ================= PAYMENTS TABLE / LIST ================= */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Unidad / Inmueble</th>
                <th className="px-4 py-3.5">Fecha & Origen</th>
                <th className="px-4 py-3.5">Método & Ref</th>
                <th className="px-4 py-3.5">Monto</th>
                <th className="px-4 py-3.5">Comprobante</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Cargando transacciones de pago...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No se encontraron pagos</p>
                    <p className="text-[11px]">
                      {searchQuery
                        ? "Ningún pago coincide con los filtros de búsqueda."
                        : "No hay pagos registrados en esta categoría."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isPending = p.status === "pending";
                  const isPendingData = p.status === "approved_pending_data";
                  const isApproved = p.status === "approved";
                  const isRejected = p.status === "rejected";

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 transition group text-slate-700 font-medium"
                    >
                      {/* Unidad */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-black flex items-center justify-center text-[11px] border border-slate-200">
                            {p.unitCode}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              Unidad {p.unitCode}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {p.structureName || "Estructura principal"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Fecha y Origen */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">
                            {p.paymentDate}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {p.origin === "resident" ? "Por Residente" : "Pago Asistido"}
                          </span>
                        </div>
                      </td>

                      {/* Método & Ref */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">
                            {p.methodName || "Transferencia / Depósito"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Ref: {p.referenceNumber || <span className="text-amber-600 italic">S/R</span>}
                            {p.phoneFrom ? ` • Tel: ${p.phoneFrom}` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Monto */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900 text-sm block">
                            ${parseFloat(p.amount).toFixed(2)} {p.currency}
                          </span>
                          {p.exchangeRate && (
                            <span className="text-[10px] text-slate-400 block">
                              Tasa: {p.exchangeRate}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Comprobante */}
                      <td className="px-4 py-3.5">
                        {p.hasReceipt ? (
                          <button
                            onClick={async () => {
                              // Fetch full detail with receipt URL
                              const detail = await fetchApi<any>(`/payments/${p.id}`);
                              const file = detail?.receipts?.[0]?.fileUrl;
                              if (file) {
                                setSelectedReceiptUrl(file);
                                setShowReceiptViewerModal(true);
                              } else {
                                notify("El comprobante no tiene URL adjunta", true);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-[11px] font-bold transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Recibo</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Sin comprobante
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3.5">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Aprobado
                          </span>
                        )}
                        {isPendingData && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/80 border border-rose-300 px-2.5 py-1 rounded-full" title={p.pendingDataReason}>
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Pend. Datos
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 border border-amber-300 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Por Revisar
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-200/80 border border-slate-300 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3 h-3 text-slate-500" />
                            Rechazado
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If pending: Approve / Reject */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprovePayment(p.id)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer shadow-sm"
                                title="Aprobar pago y acreditar cuotas"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPaymentToReject(p);
                                  setShowRejectModal(true);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                                title="Rechazar pago"
                              >
                                Rechazar
                              </button>
                            </>
                          )}

                          {/* If approved_pending_data: Complete data */}
                          {isPendingData && (
                            <button
                              onClick={() => {
                                setSelectedPaymentToComplete(p);
                                setCompleteDataForm({
                                  methodId: p.methodId || "",
                                  referenceNumber: p.referenceNumber || "",
                                  phoneFrom: p.phoneFrom || "",
                                  receiptFileUrl: "",
                                  reviewNotes: "",
                                });
                                setShowCompleteDataModal(true);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition cursor-pointer shadow-sm flex items-center gap-1"
                              title="Cargar datos bancarios faltantes"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Completar</span>
                            </button>
                          )}

                          {/* Official Receipt Button (For all approved or registered payments) */}
                          <button
                            onClick={() => handleViewOfficialReceipt(p.id)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            title="Ver Recibo Oficial PDF"
                          >
                            <Receipt className="w-4 h-4 text-emerald-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: REGISTRAR PAGO ASISTIDO (ADMIN) ================= */}
      {showAssistedPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 my-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Registrar Pago Asistido
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registro de pago en caja o recepción por administración
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssistedPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssistedPayment} className="space-y-4 text-xs">
              {/* Unidad */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Unidad Residencial *
                </label>
                <select
                  required
                  value={assistedForm.unitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold"
                >
                  <option value="">Seleccione la unidad que paga...</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unidad {u.code} {u.structureName ? `(${u.structureName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cuotas pendientes detectadas */}
              {assistedForm.unitId && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">
                      Cuotas pendientes detectadas:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {unitPendingCharges.length} cuotas pendientes
                    </span>
                  </div>

                  {loadingCharges ? (
                    <p className="text-slate-400 italic">Consultando cuotas...</p>
                  ) : unitPendingCharges.length === 0 ? (
                    <p className="text-emerald-600 text-[11px] font-medium">
                      ✓ La unidad está al día con sus cuotas registradas. (Se creará como abono general).
                    </p>
                  ) : (
                    <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                      {unitPendingCharges.map((ch: any) => {
                        const isChecked = assistedForm.selectedChargeIds.includes(ch.id);
                        return (
                          <label
                            key={ch.id}
                            className={`flex items-center justify-between p-2 rounded-xl text-[11px] border cursor-pointer transition ${
                              isChecked
                                ? "bg-emerald-50/80 border-emerald-300 text-slate-900"
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setAssistedForm((prev) => {
                                    const next = checked
                                      ? [...prev.selectedChargeIds, ch.id]
                                      : prev.selectedChargeIds.filter((id) => id !== ch.id);
                                    return { ...prev, selectedChargeIds: next };
                                  });
                                }}
                                className="rounded text-emerald-600"
                              />
                              <span className="font-bold">Período {ch.period}</span>
                            </div>
                            <span className="font-black text-slate-800">
                              ${parseFloat(ch.totalAmount).toFixed(2)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Monto y Método */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Monto a Registrar ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={assistedForm.amount}
                    onChange={(e) =>
                      setAssistedForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Medio de Pago
                  </label>
                  <select
                    value={assistedForm.methodId}
                    onChange={(e) =>
                      setAssistedForm((prev) => ({ ...prev, methodId: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium"
                  >
                    <option value="">Seleccione medio de pago...</option>
                    {paymentMethods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha & Referencia */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fecha del Pago *
                  </label>
                  <input
                    type="date"
                    required
                    value={assistedForm.paymentDate}
                    onChange={(e) =>
                      setAssistedForm((prev) => ({ ...prev, paymentDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    N° de Referencia Bancaria
                  </label>
                  <input
                    type="text"
                    placeholder="ej: REF-837492"
                    value={assistedForm.referenceNumber}
                    onChange={(e) =>
                      setAssistedForm((prev) => ({ ...prev, referenceNumber: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Teléfono origen */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Teléfono de Origen (Pago Móvil / Contacto)
                </label>
                <input
                  type="text"
                  placeholder="ej: 0414-1234567"
                  value={assistedForm.phoneFrom}
                  onChange={(e) =>
                    setAssistedForm((prev) => ({ ...prev, phoneFrom: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                />
              </div>

              {/* Subida de Comprobante Opcional */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Comprobante o Captura (Opcional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleReceiptFileChange(e, "assisted")}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                  {assistedForm.receiptFileUrl && (
                    <span className="text-[11px] font-bold text-emerald-600">
                      ✓ Cargado
                    </span>
                  )}
                </div>
              </div>

              {/* RF-M07-008: Checkbox Aprobado Pendiente de Datos */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assistedForm.isApprovedPendingData}
                    onChange={(e) =>
                      setAssistedForm((prev) => ({
                        ...prev,
                        isApprovedPendingData: e.target.checked,
                      }))
                    }
                    className="mt-0.5 rounded text-amber-600"
                  />
                  <div>
                    <span className="font-black text-amber-900 block text-xs">
                      Registrar como "Aprobado Pendiente de Datos"
                    </span>
                    <span className="text-[11px] text-amber-800/80 block">
                      Marque si el residente pagó pero aún no entrega el número de referencia exacto o comprobante físico bancario.
                    </span>
                  </div>
                </label>

                {assistedForm.isApprovedPendingData && (
                  <div>
                    <input
                      type="text"
                      placeholder="Motivo (ej: Recibido en efectivo en garita / Pendiente comprobante)"
                      value={assistedForm.pendingDataReason}
                      onChange={(e) =>
                        setAssistedForm((prev) => ({
                          ...prev,
                          pendingDataReason: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-slate-800 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAssistedPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Procesando..." : "Guardar y Procesar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: MEDIOS DE PAGO DEL CONDOMINIO (RF-M07-001) ================= */}
      {showMethodsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-6 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Medios de Pago del Condominio
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cuentas receptoras oficiales visibles para los residentes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMethodsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of active methods */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Medios de Pago Configurados ({paymentMethods.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map((m) => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl border transition space-y-2 ${
                      m.isActive
                        ? "bg-slate-50/80 border-slate-200"
                        : "bg-slate-100/50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs">
                        {m.name}
                      </span>
                      <span
                        onClick={() => handleToggleMethodActive(m)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition ${
                          m.isActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {m.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      {m.details?.bankName && <p>Banco: {m.details.bankName}</p>}
                      {m.details?.accountNumber && (
                        <p className="font-mono text-xs">N°: {m.details.accountNumber}</p>
                      )}
                      {m.details?.phone && <p>Tel: {m.details.phone}</p>}
                      {m.details?.holderName && <p>Titular: {m.details.holderName}</p>}
                      {m.details?.holderId && <p>CI/RIF: {m.details.holderId}</p>}
                      {m.details?.email && <p>Email: {m.details.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form to create new method */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                + Agregar Nuevo Medio de Pago
              </h4>
              <form onSubmit={handleCreatePaymentMethod} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nombre del Método *
                    </label>
                    <input
                      type="text"
                      placeholder="ej: Pago Móvil Banesco"
                      required
                      value={newMethodForm.name}
                      onChange={(e) =>
                        setNewMethodForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tipo de Instrumento
                    </label>
                    <select
                      value={newMethodForm.type}
                      onChange={(e) =>
                        setNewMethodForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    >
                      <option value="transfer">Transferencia Bancaria</option>
                      <option value="mobile_payment">Pago Móvil</option>
                      <option value="other">Zelle / Billetera Digital</option>
                      <option value="cash">Efectivo / Taquilla</option>
                      <option value="check">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Banco</label>
                    <input
                      type="text"
                      placeholder="ej: Banesco (0134)"
                      value={newMethodForm.bankName}
                      onChange={(e) =>
                        setNewMethodForm((prev) => ({ ...prev, bankName: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">N° de Cuenta</label>
                    <input
                      type="text"
                      placeholder="0134-..."
                      value={newMethodForm.accountNumber}
                      onChange={(e) =>
                        setNewMethodForm((prev) => ({ ...prev, accountNumber: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Teléfono Pago Móvil</label>
                    <input
                      type="text"
                      placeholder="0414-..."
                      value={newMethodForm.phone}
                      onChange={(e) =>
                        setNewMethodForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Titular</label>
                    <input
                      type="text"
                      placeholder="Condominio..."
                      value={newMethodForm.holderName}
                      onChange={(e) =>
                        setNewMethodForm((prev) => ({ ...prev, holderName: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">CI / RIF</label>
                    <input
                      type="text"
                      placeholder="J-..."
                      value={newMethodForm.holderId}
                      onChange={(e) =>
                        setNewMethodForm((prev) => ({ ...prev, holderId: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-md"
                  >
                    Guardar Nuevo Método
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: COMPLETAR DATOS PENDIENTES (RF-M07-009) ================= */}
      {showCompleteDataModal && selectedPaymentToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Completar Datos de Pago
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Unidad {selectedPaymentToComplete.unitCode} • Monto: ${selectedPaymentToComplete.amount}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCompleteDataModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedPaymentToComplete.pendingDataReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-medium">
                <span className="font-bold block">Motivo pendiente registrado:</span>
                {selectedPaymentToComplete.pendingDataReason}
              </div>
            )}

            <form onSubmit={handleCompleteDataSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  N° de Referencia Bancaria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: REF-92837492"
                  value={completeDataForm.referenceNumber}
                  onChange={(e) =>
                    setCompleteDataForm((prev) => ({
                      ...prev,
                      referenceNumber: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Teléfono de Contacto / Pago Móvil
                </label>
                <input
                  type="text"
                  placeholder="ej: 0414-1234567"
                  value={completeDataForm.phoneFrom}
                  onChange={(e) =>
                    setCompleteDataForm((prev) => ({
                      ...prev,
                      phoneFrom: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Adjuntar Comprobante
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleReceiptFileChange(e, "complete")}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCompleteDataModal(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md transition disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Completar y Aprobar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: RECHAZAR PAGO ================= */}
      {showRejectModal && selectedPaymentToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
            <div className="flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Rechazar Pago</h3>
            </div>

            <p className="text-xs text-slate-600">
              Indique el motivo por el cual este pago no es válido (ej: referencia no encontrada en extracto bancario, monto incorrecto).
            </p>

            <form onSubmit={handleRejectPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo de Rechazo *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="ej: Referencia no coincide con la conciliación del día..."
                  value={rejectForm.reason}
                  onChange={(e) =>
                    setRejectForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition disabled:opacity-50"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: VISOR DE COMPROBANTE SUBIDO ================= */}
      {showReceiptViewerModal && selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-3 my-auto">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">Comprobante Adjunto</span>
              <button
                onClick={() => setShowReceiptViewerModal(false)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center max-h-[70vh]">
              {selectedReceiptUrl.startsWith("data:image") || selectedReceiptUrl.startsWith("http") ? (
                <img
                  src={selectedReceiptUrl}
                  alt="Comprobante de pago"
                  className="w-full h-auto object-contain max-h-[70vh]"
                />
              ) : (
                <iframe
                  src={selectedReceiptUrl}
                  title="Comprobante"
                  className="w-full h-96"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: RECIBO OFICIAL PRINT/PDF ================= */}
      <OfficialReceiptModal
        isOpen={showOfficialReceiptModal}
        onClose={() => setShowOfficialReceiptModal(false)}
        receiptData={currentReceiptData}
        currencySymbol="$"
      />
    </div>
  );
}
