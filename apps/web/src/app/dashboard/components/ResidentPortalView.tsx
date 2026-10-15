"use client";

import React, { useState, useEffect } from "react";
import {
  Home,
  Building2,
  Search,
  KeyRound,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowRight,
  Plus,
  RefreshCw,
  MapPin,
  ExternalLink,
  User,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  ArrowRightLeft,
  Receipt,
  DollarSign,
  CreditCard,
  Upload,
  FileCheck,
  Eye,
} from "lucide-react";
import { fetchApi } from "../../../lib/api";
import { OfficialReceiptModal } from "./OfficialReceiptModal";

interface ResidentPortalViewProps {
  currentUser: any;
  notify: (msg: string, isError?: boolean) => void;
}

export function ResidentPortalView({ currentUser, notify }: ResidentPortalViewProps) {
  const [activeTab, setActiveTab] = useState<
    "properties" | "statements" | "payments" | "search_link" | "requests"
  >("properties");

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Data
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  // Statements state
  const [selectedStatementUnitId, setSelectedStatementUnitId] = useState<string>("");
  const [statementData, setStatementData] = useState<any | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const loadStatement = async (unitId: string) => {
    if (!unitId) return;
    setSelectedStatementUnitId(unitId);
    setStatementLoading(true);
    try {
      const res = await fetchApi<any>(`/units/${unitId}/statement`);
      setStatementData(res);
    } catch (err: any) {
      notify(err.message || "Error al cargar estado de cuenta", true);
    } finally {
      setStatementLoading(false);
    }
  };

  // Search Condos state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCondo, setSelectedCondo] = useState<any | null>(null);
  const [unitCodeToLink, setUnitCodeToLink] = useState("");

  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferOwnershipId, setTransferOwnershipId] = useState("");
  const [transferUnitCode, setTransferUnitCode] = useState("");
  const [transferForm, setTransferForm] = useState({
    toPersonId: "",
    contractFileUrl: "",
  });
  const [personsList, setPersonsList] = useState<any[]>([]);

  // Payments state (Fase 5)
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentUnitId, setSelectedPaymentUnitId] = useState<string>("");
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>([]);
  const [paymentForm, setPaymentForm] = useState({
    methodId: "",
    referenceNumber: "",
    paymentDate: new Date().toISOString().split("T")[0],
    phoneFrom: "",
    receiptFileUrl: "",
    receiptFileName: "",
    receiptFileType: "",
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Official Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const loadPaymentsData = async (condoId?: string) => {
    try {
      const [payments, methods] = await Promise.all([
        fetchApi<any[]>("/me/payments").catch(() => []),
        condoId
          ? fetchApi<any[]>(`/payment-methods?condominiumId=${condoId}&onlyActive=true`).catch(() => [])
          : Promise.resolve([]),
      ]);
      setMyPayments(payments || []);
      if (methods && methods.length > 0) setPaymentMethods(methods);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPortalData = async () => {
    try {
      setLoading(true);
      const [props, reqs] = await Promise.all([
        fetchApi<any[]>("/me/properties").catch(() => []),
        fetchApi<any[]>("/resident-link-requests").catch(() => []),
      ]);
      setMyProperties(props || []);
      if (props && props.length > 0) {
        if (!selectedStatementUnitId) setSelectedStatementUnitId(props[0].unitId);
        if (!selectedPaymentUnitId) setSelectedPaymentUnitId(props[0].unitId);
        loadPaymentsData(props[0].condominiumId);
      }
      // Filter requests submitted by this user
      if (currentUser?.id) {
        setMyRequests(reqs?.filter((r) => r.userId === currentUser.id) || reqs || []);
      } else {
        setMyRequests(reqs || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [currentUser?.id]);

  // Handle Resident Payment Submission (Fase 5)
  const handleResidentReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentForm((prev) => ({
        ...prev,
        receiptFileUrl: reader.result as string,
        receiptFileName: file.name,
        receiptFileType: file.type || "image/jpeg",
      }));
      notify(`Comprobante "${file.name}" cargado exitosamente.`);
    };
    reader.readAsDataURL(file);
  };

  const handleResidentSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentUnitId) {
      notify("Seleccione el inmueble o unidad a pagar", true);
      return;
    }
    if (selectedChargeIds.length === 0) {
      notify("Debe seleccionar al menos una cuota o mes a pagar", true);
      return;
    }

    // Compute total
    const pendingCharges = statementData?.charges || [];
    const chosen = pendingCharges.filter((c: any) => selectedChargeIds.includes(c.id));
    const totalAmount = chosen.reduce(
      (acc: number, cur: any) =>
        acc + (parseFloat(cur.totalAmount) - parseFloat(cur.paidAmount || "0")),
      0
    );

    const activeProp = myProperties.find((p) => p.unitId === selectedPaymentUnitId);
    if (!activeProp) {
      notify("Inmueble no válido", true);
      return;
    }

    try {
      setSubmittingPayment(true);
      const res = await fetchApi<any>("/payments", {
        method: "POST",
        body: JSON.stringify({
          condominiumId: activeProp.condominiumId,
          unitId: selectedPaymentUnitId,
          methodId: paymentForm.methodId || null,
          amount: totalAmount.toFixed(2),
          currency: "USD",
          referenceNumber: paymentForm.referenceNumber || null,
          paymentDate: paymentForm.paymentDate,
          phoneFrom: paymentForm.phoneFrom || null,
          chargeIds: selectedChargeIds,
          receiptFileUrl: paymentForm.receiptFileUrl || null,
          receiptFileName: paymentForm.receiptFileName || null,
          receiptFileType: paymentForm.receiptFileType || null,
        }),
      });

      notify(res?.message || "Pago reportado exitosamente");
      setPaymentForm({
        methodId: "",
        referenceNumber: "",
        paymentDate: new Date().toISOString().split("T")[0],
        phoneFrom: "",
        receiptFileUrl: "",
        receiptFileName: "",
        receiptFileType: "",
      });
      setSelectedChargeIds([]);
      loadStatement(selectedPaymentUnitId);
      loadPaymentsData(activeProp.condominiumId);
    } catch (err: any) {
      notify(err.message || "Error al registrar el pago", true);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleViewOfficialReceipt = async (paymentId: string) => {
    try {
      const data = await fetchApi<any>(`/payments/${paymentId}/receipt`);
      setReceiptData(data);
      setShowReceiptModal(true);
    } catch (err: any) {
      notify(err.message || "Error al cargar comprobante oficial", true);
    }
  };

  // Live search for residences / condominiums
  const handleSearchCondominiums = async (query: string) => {
    setSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await fetchApi<any[]>(
        `/condominiums/public-search?q=${encodeURIComponent(query.trim())}`
      );
      setSearchResults(results || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // Submit link request
  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCondo) {
      notify("Selecciona primero una residencia o condominio", true);
      return;
    }
    if (!unitCodeToLink.trim()) {
      notify("Ingresa el código oficial de tu inmueble (ej: 1-A, PH-1, Casa 12)", true);
      return;
    }

    try {
      setActionLoading(true);
      await fetchApi("/resident-link-requests", {
        method: "POST",
        body: JSON.stringify({
          condominiumId: selectedCondo.id,
          unitCode: unitCodeToLink.trim().toUpperCase(),
        }),
      });

      notify(
        `¡Solicitud enviada con éxito! La junta de administración de ${selectedCondo.name} revisará tu solicitud para la unidad ${unitCodeToLink.trim().toUpperCase()}.`
      );

      setSelectedCondo(null);
      setUnitCodeToLink("");
      setActiveTab("requests");
      loadPortalData();
    } catch (err: any) {
      notify(err.message || "Error al enviar la solicitud de vinculación", true);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequests = myRequests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-sky-800/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-sky-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold backdrop-blur-md border border-sky-400/30">
              <Home className="w-3.5 h-3.5" />
              <span>Portal del Residente & Propietario</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bienvenido, {currentUser?.fullName || "Residente"}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Consulta tus inmuebles asignados, el estado de tus cuotas y realiza la vinculación
              directa con tus residencias y apartamentos mediante solicitud oficial a la administración.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab("search_link")}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-lg shadow-sky-500/25 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Vincular Nueva Propiedad</span>
            </button>
            <button
              onClick={loadPortalData}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200/80 flex flex-wrap gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("properties")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "properties"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Mis Inmuebles ({myProperties.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("statements");
            if (myProperties.length > 0 && !selectedStatementUnitId) {
              loadStatement(myProperties[0].unitId);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "statements"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Estado de Cuenta y Cuotas</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("payments");
            const condoId =
              myProperties.find((p) => p.unitId === selectedPaymentUnitId)?.condominiumId ||
              myProperties[0]?.condominiumId;
            loadPaymentsData(condoId);
            if (myProperties.length > 0) {
              const uId = selectedPaymentUnitId || myProperties[0].unitId;
              setSelectedPaymentUnitId(uId);
              loadStatement(uId);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "payments"
              ? "bg-emerald-600 text-white shadow-sm font-bold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-300" />
          <span>Reportar Pago & Comprobantes</span>
          {myPayments.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-bold ml-1">
              {myPayments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("search_link")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "search_link"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Buscar y Vincular Inmueble</span>
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer relative ${
            activeTab === "requests"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Mis Solicitudes ({myRequests.length})</span>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold ml-1">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: MIS INMUEBLES */}
      {activeTab === "properties" && (
        <div className="space-y-4">
          {myProperties.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-4 max-w-xl mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100">
                <Home className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">No tienes inmuebles vinculados</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Para ver tus cuotas mensuales, recibos de pago y notificaciones de tu condominio,
                  vincula tu cuenta indicando la residencia donde habitas o tienes propiedades.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("search_link")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 cursor-pointer transition"
              >
                <Search className="w-4 h-4" />
                <span>Buscar mi Condominio</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myProperties.map((prop) => (
                <div
                  key={prop.ownershipId}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-xl bg-sky-50 text-sky-700 font-mono text-base font-bold border border-sky-200">
                        Unidad {prop.unitCode}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Titular Verificado</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-base font-extrabold text-slate-800">
                        {prop.condominiumName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{prop.condominiumAddress}</span>
                      </div>
                      <div className="text-xs text-slate-400 pt-1">
                        {prop.structureName ? `${prop.structureName} · ` : ""}Tipo: {prop.unitType}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span>Titularidad activa desde:</span>
                      <strong className="text-slate-800">{prop.startDate}</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Al día</span>
                    </span>
                    <button
                      onClick={() => {
                        setTransferOwnershipId(prop.ownershipId);
                        setTransferUnitCode(prop.unitCode);
                        setShowTransferModal(true);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Traspasar Propiedad</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ESTADOS DE CUENTA Y CUOTAS */}
      {activeTab === "statements" && (
        <div className="space-y-6">
          {myProperties.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-4 max-w-xl mx-auto shadow-sm">
              <Receipt className="w-12 h-12 text-slate-400 mx-auto opacity-60" />
              <h3 className="text-lg font-bold text-slate-800">No tienes inmuebles vinculados</h3>
              <p className="text-xs text-slate-500">
                Vincula tu apartamento o casa para consultar tus cuotas, montos adeudados y estado de cuenta.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Property Selector if multiple */}
              {myProperties.length > 1 && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600">Seleccionar Inmueble:</span>
                  <div className="flex flex-wrap gap-2">
                    {myProperties.map((p) => (
                      <button
                        key={p.unitId}
                        onClick={() => loadStatement(p.unitId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          selectedStatementUnitId === p.unitId
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Unidad {p.unitCode} ({p.condominiumName})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {statementLoading ? (
                <div className="bg-white rounded-3xl p-12 text-center text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                  Cargando estado de cuenta...
                </div>
              ) : statementData ? (
                <div className="space-y-6">
                  {/* Summary Header Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Saldo Total Adeudado
                        </span>
                        <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
                          USD {statementData.summary.totalDebt}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Mora por Atraso
                        </span>
                        <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
                          USD {statementData.summary.totalMora}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Total Pagado Acumulado
                        </span>
                        <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                          USD {statementData.summary.totalPaid}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Charges Table */}
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">Historial de Cuotas y Recibos</h3>
                        <p className="text-xs text-slate-500">
                          Detalle mensual de conceptos ordinarios, extraordinarios, impuestos aplicados y mora
                        </p>
                      </div>
                      <button
                        onClick={() => loadStatement(selectedStatementUnitId || myProperties[0]?.unitId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Actualizar
                      </button>
                    </div>

                    {statementData.charges.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-sm">
                        No hay cargos registrados aún para esta unidad.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4">Período</th>
                              <th className="py-3 px-4">Concepto</th>
                              <th className="py-3 px-4">Base</th>
                              <th className="py-3 px-4">IVA</th>
                              <th className="py-3 px-4">Mora</th>
                              <th className="py-3 px-4">Total</th>
                              <th className="py-3 px-4">Vencimiento</th>
                              <th className="py-3 px-4 text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {statementData.charges.map((item: any) => {
                              const c = item.charge;
                              const isPaid = c.status === "paid";
                              const isOverdue = c.status === "overdue";
                              return (
                                <tr key={c.id} className="hover:bg-slate-50/50 transition">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.period}</td>
                                  <td className="py-3 px-4 text-slate-700 font-semibold">{item.feePlanName}</td>
                                  <td className="py-3 px-4 font-mono text-slate-600">
                                    {c.currency} {Number(c.amountBase).toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-600">
                                    {c.currency} {Number(c.taxAmount).toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-amber-600 font-bold">
                                    {Number(c.moraAmount) > 0 ? `+${c.currency} ${Number(c.moraAmount).toFixed(2)}` : "-"}
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                    {c.currency} {Number(c.totalAmount).toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 text-slate-500 font-mono">{c.dueDate}</td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        isPaid
                                          ? "bg-emerald-100 text-emerald-800"
                                          : isOverdue
                                          ? "bg-rose-100 text-rose-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {isPaid ? "Solvente" : isOverdue ? "Vencido" : "Pendiente"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB: REPORTAR PAGO Y COMPROBANTES (FASE 5) ================= */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          {myProperties.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-4 max-w-xl mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">No tienes inmuebles vinculados</h3>
                <p className="text-xs text-slate-500">
                  Para reportar pagos o consultar recibos, primero debes vincular tu unidad residencial.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("search_link")}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition cursor-pointer"
              >
                Buscar mi Residencia
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Unit Selector if multiple */}
              {myProperties.length > 1 && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600">Seleccionar Inmueble:</span>
                  <div className="flex flex-wrap gap-2">
                    {myProperties.map((p) => (
                      <button
                        key={p.unitId}
                        onClick={() => {
                          setSelectedPaymentUnitId(p.unitId);
                          loadStatement(p.unitId);
                          loadPaymentsData(p.condominiumId);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          selectedPaymentUnitId === p.unitId
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Unidad {p.unitCode} ({p.condominiumName})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* FORM COLUMN: SELECCIÓN DE MESES & SUBIDA DE COMPROBANTE */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CreditCard className="w-5 h-5" />
                      <h3 className="text-base font-black text-slate-900">
                        Reportar Pago de Condominio
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Selecciona las cuotas a liquidar, adjunta tu comprobante y la referencia para conciliación inmediata.
                    </p>
                  </div>

                  <form onSubmit={handleResidentSubmitPayment} className="space-y-5 text-xs">
                    {/* PASO 1: SELECCIÓN DE CUOTAS / MESES (RF-M07-002) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-extrabold text-slate-800 text-xs">
                          1. Selecciona los meses o cuotas a pagar *
                        </label>
                        <span className="text-[11px] font-bold text-emerald-600">
                          {selectedChargeIds.length} seleccionados
                        </span>
                      </div>

                      {statementLoading ? (
                        <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-2xl">
                          Consultando cuotas del inmueble...
                        </div>
                      ) : !statementData?.charges || statementData.charges.length === 0 ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-center font-medium">
                          ✓ No tienes cuotas pendientes registradas en este inmueble.
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                          {statementData.charges
                            .filter((c: any) => c.status !== "paid")
                            .map((charge: any) => {
                              const isSelected = selectedChargeIds.includes(charge.id);
                              const pending =
                                parseFloat(charge.totalAmount) -
                                parseFloat(charge.paidAmount || "0");
                              return (
                                <label
                                  key={charge.id}
                                  className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                                    isSelected
                                      ? "bg-emerald-50/80 border-emerald-400 text-slate-900 shadow-xs"
                                      : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setSelectedChargeIds((prev) =>
                                          checked
                                            ? [...prev, charge.id]
                                            : prev.filter((id) => id !== charge.id)
                                        );
                                      }}
                                      className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                                    />
                                    <div>
                                      <span className="font-black text-slate-900 text-xs block">
                                        Período {charge.period}
                                      </span>
                                      <span className="text-[10px] text-slate-400 block">
                                        Vence: {charge.dueDate} • Estado: {charge.status}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <span className="font-extrabold text-slate-900 text-xs block">
                                      USD ${pending.toFixed(2)}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Total: ${parseFloat(charge.totalAmount).toFixed(2)}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                        </div>
                      )}

                      {/* RF-M07-003: CÁLCULO AUTOMÁTICO DEL TOTAL */}
                      <div className="flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-2xl">
                        <span className="text-xs font-bold text-slate-300">
                          Total a Pagar Calculado:
                        </span>
                        <span className="text-base font-black text-emerald-400">
                          $
                          {statementData?.charges
                            ?.filter((c: any) => selectedChargeIds.includes(c.id))
                            .reduce(
                              (acc: number, cur: any) =>
                                acc +
                                (parseFloat(cur.totalAmount) -
                                  parseFloat(cur.paidAmount || "0")),
                              0
                            )
                            .toFixed(2)}{" "}
                          USD
                        </span>
                      </div>
                    </div>

                    {/* PASO 2: SELECCIÓN DE CUENTA / MEDIO DE PAGO */}
                    <div className="space-y-2">
                      <label className="font-extrabold text-slate-800 text-xs block">
                        2. Cuenta receptora donde realizó el pago *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {paymentMethods.map((m) => {
                          const isChosen = paymentForm.methodId === m.id;
                          return (
                            <div
                              key={m.id}
                              onClick={() =>
                                setPaymentForm((prev) => ({ ...prev, methodId: m.id }))
                              }
                              className={`p-3 rounded-2xl border text-[11px] transition cursor-pointer ${
                                isChosen
                                  ? "bg-emerald-50 border-emerald-400 shadow-sm"
                                  : "bg-slate-50/70 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>{m.name}</span>
                                {isChosen && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                                {m.details?.bankName && <p>{m.details.bankName}</p>}
                                {m.details?.accountNumber && (
                                  <p className="font-mono text-slate-700 font-bold">{m.details.accountNumber}</p>
                                )}
                                {m.details?.phone && <p>Tel: {m.details.phone}</p>}
                                {m.details?.holderId && <p>CI/RIF: {m.details.holderId}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* PASO 3: DATOS DE REFERENCIA */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          N° de Referencia Bancaria *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="ej: REF-928374"
                          value={paymentForm.referenceNumber}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({
                              ...prev,
                              referenceNumber: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Fecha de la Transferencia *
                        </label>
                        <input
                          type="date"
                          required
                          value={paymentForm.paymentDate}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({
                              ...prev,
                              paymentDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs"
                        />
                      </div>
                    </div>

                    {/* Teléfono origen */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Teléfono Emisor (en caso de Pago Móvil)
                      </label>
                      <input
                        type="text"
                        placeholder="ej: 0414-1234567"
                        value={paymentForm.phoneFrom}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            phoneFrom: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium"
                      />
                    </div>

                    {/* PASO 4: COMPROBANTE SUBIDO (RF-M07-004) */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Adjuntar Comprobante o Captura de Pantalla *
                      </label>
                      <div className="p-4 border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-2xl bg-slate-50 text-center space-y-2 transition">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                        <div className="text-[11px] text-slate-600">
                          <label className="font-bold text-emerald-600 hover:underline cursor-pointer">
                            Haz clic para seleccionar comprobante
                            <input
                              type="file"
                              required
                              accept="image/*,application/pdf"
                              onChange={handleResidentReceiptUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Formatos soportados: JPG, PNG, PDF (Máx 5MB)
                          </p>
                        </div>

                        {paymentForm.receiptFileUrl && (
                          <div className="pt-2 flex items-center justify-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-100/60 py-1.5 px-3 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{paymentForm.receiptFileName || "Comprobante cargado"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* BOTÓN SUBMIT */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submittingPayment || selectedChargeIds.length === 0}
                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {submittingPayment ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Enviando pago a administración...</span>
                          </>
                        ) : (
                          <>
                            <FileCheck className="w-4 h-4" />
                            <span>Reportar y Enviar Pago</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* HISTORIAL COLUMN: MIS PAGOS REPORTADOS */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        Mis Pagos Reportados
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Historial de transacciones y recibos oficiales
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const condoId =
                          myProperties.find((p) => p.unitId === selectedPaymentUnitId)
                            ?.condominiumId || myProperties[0]?.condominiumId;
                        loadPaymentsData(condoId);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                      title="Actualizar pagos"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {myPayments.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-600 text-xs">Sin pagos registrados</p>
                      <p className="text-[11px]">
                        Aquí aparecerán tus pagos reportados con su estatus de revisión y recibos descargables.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                      {myPayments.map((p) => {
                        const isApproved = p.status === "approved";
                        const isPendingData = p.status === "approved_pending_data";
                        const isPending = p.status === "pending";
                        const isRejected = p.status === "rejected";

                        return (
                          <div
                            key={p.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 hover:bg-slate-50 transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900 text-sm">
                                ${parseFloat(p.amount).toFixed(2)} {p.currency}
                              </span>

                              {isApproved && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Aprobado
                                </span>
                              )}
                              {isPendingData && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  Aprobado (Pend. Datos)
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3 text-sky-600" />
                                  En Revisión
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  Rechazado
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-600 space-y-0.5">
                              <p className="font-medium">
                                Unidad {p.unitCode} • Fecha: {p.paymentDate}
                              </p>
                              <p className="font-mono text-slate-500">
                                Ref: {p.referenceNumber || "S/R"}
                              </p>
                              {p.reviewNotes && (
                                <p className="text-[10px] text-slate-400 italic">
                                  Nota: {p.reviewNotes}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">
                                {p.origin === "resident" ? "Reportado por ti" : "Asistido"}
                              </span>
                              <button
                                onClick={() => handleViewOfficialReceipt(p.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Ver Recibo Oficial</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Official Receipt Modal */}
      <OfficialReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receiptData={receiptData}
        currencySymbol="$"
      />

      {/* TAB 2: SEARCH AND LINK RESIDENCE */}
      {activeTab === "search_link" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6 max-w-3xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800">
              Asistente de Vinculación con tu Inmueble
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Busca tu residencia o condominio por su nombre oficial o dirección física. Luego,
              introduce la nomenclatura de tu casa o apartamento para remitir la solicitud a tu administración.
            </p>
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              1. Buscar Condominio o Residencia
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Escribe el nombre del edificio o dirección (ej: Ávila, Altamira, Los Palos Grandes)..."
                value={searchQuery}
                onChange={(e) => handleSearchCondominiums(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
              />
              {searching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Buscando...</span>
                </div>
              )}
            </div>
          </div>

          {/* Results list */}
          {searchResults.length > 0 && (
            <div className="space-y-2 animate-in fade-in">
              <div className="text-xs font-semibold text-slate-500">Coincidencias encontradas:</div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                {searchResults.map((condo) => (
                  <div
                    key={condo.id}
                    onClick={() => setSelectedCondo(condo)}
                    className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition ${
                      selectedCondo?.id === condo.id
                        ? "bg-sky-50 border-l-4 border-l-sky-500"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <span>{condo.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                          {condo.code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{condo.address || "Dirección registrada"}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        selectedCondo?.id === condo.id
                          ? "bg-sky-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {selectedCondo?.id === condo.id ? "Seleccionado ✓" : "Seleccionar"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Unit code submission */}
          {selectedCondo && (
            <form
              onSubmit={handleSubmitLink}
              className="p-5 rounded-2xl bg-slate-50 border border-sky-100 space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">Condominio Seleccionado:</div>
                  <div className="text-sm font-bold text-slate-800">{selectedCondo.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCondo(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cambiar
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  2. Código o Nomenclatura de tu Inmueble *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 1-A, 1-B, 3-C, PH-1, Casa 24..."
                  value={unitCodeToLink}
                  onChange={(e) => setUnitCodeToLink(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base font-bold font-mono tracking-wider uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-400">
                  Ingresa exactamente el código con el cual tu apartamento o casa está registrada en el condominio.
                </p>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando solicitud...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Enviar Solicitud de Vinculación</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: RESIDENT'S OWN REQUESTS */}
      {activeTab === "requests" && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Historial de Solicitudes Enviadas
              </h3>
              <p className="text-xs text-slate-500">
                Consulta el estado de aprobación por parte del comité o administrador del condominio.
              </p>
            </div>
            <button
              onClick={loadPortalData}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Residencia</th>
                  <th className="px-6 py-3.5">Unidad Solicitada</th>
                  <th className="px-6 py-3.5">Fecha</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                      No has realizado ninguna solicitud de vinculación todavía.
                    </td>
                  </tr>
                ) : (
                  myRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {req.condominium?.name || "Condominio"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                          {req.unitCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(req.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {req.status === "pending" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>En revisión</span>
                          </span>
                        )}
                        {req.status === "approved" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aprobada</span>
                          </span>
                        )}
                        {req.status === "rejected" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rechazada</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-slate-500">
                        {req.rejectionReason ? (
                          <span className="text-rose-600 font-medium">
                            Motivo: {req.rejectionReason}
                          </span>
                        ) : req.status === "approved" ? (
                          <span className="text-emerald-600 font-medium">Vinculación activa</span>
                        ) : (
                          <span className="text-slate-400">Pendiente por junta</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
