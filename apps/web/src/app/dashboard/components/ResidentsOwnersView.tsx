"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Home,
  ShieldCheck,
  Building2,
  FileText,
  Mail,
  Phone,
  Pencil,
  Plus,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  History,
  KeyRound,
} from "lucide-react";
import { fetchApi } from "../../../lib/api";

interface ResidentsOwnersViewProps {
  condoDetails: any;
  units: any[];
  currentUser: any;
  notify: (msg: string, isError?: boolean) => void;
}

export function ResidentsOwnersView({
  condoDetails,
  units,
  currentUser,
  notify,
}: ResidentsOwnersViewProps) {
  const [activeTab, setActiveTab] = useState<
    "persons" | "ownerships" | "requests" | "my_properties"
  >("persons");

  // Loading states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Data
  const [persons, setPersons] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [personSearch, setPersonSearch] = useState("");
  const [unitSearch, setUnitSearch] = useState("");

  // Modals
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any | null>(null);
  const [personForm, setPersonForm] = useState({
    documentType: "V",
    documentNumber: "",
    fullName: "",
    email: "",
    phone: "",
  });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUnitForAssign, setSelectedUnitForAssign] = useState<any | null>(null);
  const [assignForm, setAssignForm] = useState({
    personId: "",
    startDate: new Date().toISOString().split("T")[0],
    isPrimaryResidence: true,
  });

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedOwnershipForTransfer, setSelectedOwnershipForTransfer] = useState<any | null>(null);
  const [transferForm, setTransferForm] = useState({
    toPersonId: "",
    contractFileUrl: "",
  });

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyUnit, setHistoryUnit] = useState<any | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showLinkRequestModal, setShowLinkRequestModal] = useState(false);
  const [linkRequestForm, setLinkRequestForm] = useState({
    unitCode: "",
  });

  // Load Persons
  const loadPersons = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<any[]>("/persons");
      setPersons(res || []);
    } catch (err: any) {
      notify(err.message || "Error al cargar personas", true);
    } finally {
      setLoading(false);
    }
  };

  // Load Requests
  const loadRequests = async () => {
    try {
      const res = await fetchApi<any[]>(
        condoDetails?.id
          ? `/resident-link-requests?condominiumId=${condoDetails.id}`
          : "/resident-link-requests"
      );
      setRequests(res || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Load My Properties
  const loadMyProperties = async () => {
    try {
      const res = await fetchApi<any[]>("/me/properties");
      setMyProperties(res || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPersons();
    loadRequests();
    loadMyProperties();
  }, [condoDetails?.id]);

  // Handle Save Person
  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personForm.fullName || !personForm.documentNumber) {
      notify("Nombre completo y número de documento son obligatorios", true);
      return;
    }

    try {
      setActionLoading(true);
      if (editingPerson) {
        await fetchApi(`/persons/${editingPerson.id}`, {
          method: "PATCH",
          body: JSON.stringify(personForm),
        });
        notify("Datos de la persona actualizados exitosamente");
      } else {
        await fetchApi("/persons", {
          method: "POST",
          body: JSON.stringify(personForm),
        });
        notify("Persona registrada exitosamente");
      }

      setShowPersonModal(false);
      setEditingPerson(null);
      setPersonForm({
        documentType: "V",
        documentNumber: "",
        fullName: "",
        email: "",
        phone: "",
      });
      loadPersons();
    } catch (err: any) {
      notify(err.message || "Error al guardar persona", true);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Assign Owner
  const handleAssignOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitForAssign || !assignForm.personId) {
      notify("Selecciona una persona para asignar como propietaria", true);
      return;
    }

    try {
      setActionLoading(true);
      await fetchApi(
        `/condominiums/${condoDetails.id}/units/${selectedUnitForAssign.id}/ownerships`,
        {
          method: "POST",
          body: JSON.stringify(assignForm),
        }
      );
      notify(`Propietario asignado a la unidad ${selectedUnitForAssign.code}`);
      setShowAssignModal(false);
      setSelectedUnitForAssign(null);
      loadMyProperties();
    } catch (err: any) {
      notify(err.message || "Error al asignar propietario", true);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnershipForTransfer || !transferForm.toPersonId || !transferForm.contractFileUrl) {
      notify("Completa el destinatario y la URL del contrato de traspaso", true);
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetchApi<any>(
        `/ownerships/${selectedOwnershipForTransfer.id}/transfer`,
        {
          method: "POST",
          body: JSON.stringify(transferForm),
        }
      );

      // Automatically approve if admin
      if (res?.id) {
        await fetchApi(`/transfers/${res.id}/approve`, {
          method: "PATCH",
        });
      }

      notify("Traspaso de propiedad completado y registrado exitosamente");
      setShowTransferModal(false);
      setSelectedOwnershipForTransfer(null);
      loadMyProperties();
    } catch (err: any) {
      notify(err.message || "Error al procesar el traspaso", true);
    } finally {
      setActionLoading(false);
    }
  };

  // View History
  const handleViewHistory = async (unit: any) => {
    setHistoryUnit(unit);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await fetchApi<any[]>(
        `/condominiums/${condoDetails.id}/units/${unit.id}/ownerships`
      );
      setHistoryList(res || []);
    } catch (err: any) {
      notify(err.message || "Error al cargar historial", true);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Approve Request
  const handleApproveRequest = async (id: string) => {
    try {
      setActionLoading(true);
      await fetchApi(`/resident-link-requests/${id}/approve`, {
        method: "PATCH",
      });
      notify("Solicitud de vinculación aprobada con éxito");
      loadRequests();
      loadPersons();
      loadMyProperties();
    } catch (err: any) {
      notify(err.message || "Error al aprobar la solicitud", true);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Request
  const handleRejectRequest = async (id: string) => {
    try {
      setActionLoading(true);
      await fetchApi(`/resident-link-requests/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ rejectionReason: "No coincide con los registros oficiales" }),
      });
      notify("Solicitud rechazada");
      loadRequests();
    } catch (err: any) {
      notify(err.message || "Error al rechazar la solicitud", true);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit link request (Resident flow)
  const handleSubmitLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkRequestForm.unitCode.trim()) {
      notify("Ingresa el código de la unidad", true);
      return;
    }

    try {
      setActionLoading(true);
      await fetchApi("/resident-link-requests", {
        method: "POST",
        body: JSON.stringify({
          condominiumId: condoDetails.id,
          unitCode: linkRequestForm.unitCode.trim(),
        }),
      });
      notify(
        `Solicitud enviada para la unidad ${linkRequestForm.unitCode.trim().toUpperCase()}. Esperando aprobación del administrador.`
      );
      setShowLinkRequestModal(false);
      setLinkRequestForm({ unitCode: "" });
      loadRequests();
    } catch (err: any) {
      notify(err.message || "Error al enviar la solicitud", true);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPersons = persons.filter((p) => {
    if (!personSearch) return true;
    const term = personSearch.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(term) ||
      p.documentNumber.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  });

  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-md border border-indigo-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fase 3: Módulo de Residentes y Vinculación</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Residentes, Propietarios y Titularidad
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Administra el directorio de personas, asigna titulares a cada inmueble, gestiona
              traspasos de propiedad con respaldo documental y aprueba solicitudes de residentes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setEditingPerson(null);
                setPersonForm({
                  documentType: "V",
                  documentNumber: "",
                  fullName: "",
                  email: "",
                  phone: "",
                });
                setShowPersonModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nueva Persona</span>
            </button>

            <button
              onClick={() => setShowLinkRequestModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition backdrop-blur-md border border-white/20 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Solicitar Unidad</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200/80 flex flex-wrap gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("persons")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "persons"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Directorio de Personas ({persons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ownerships")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "ownerships"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Titularidad por Unidad ({units.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition relative cursor-pointer ${
            activeTab === "requests"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Solicitudes de Vinculación</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white ml-1">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("my_properties")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "my_properties"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Mis Propiedades ({myProperties.length})</span>
        </button>
      </div>

      {/* TAB 1: PERSONS DIRECTORY */}
      {activeTab === "persons" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, documento o email..."
                value={personSearch}
                onChange={(e) => setPersonSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Total registradas: <strong>{filteredPersons.length}</strong></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Persona / Residente</th>
                    <th className="px-6 py-3.5">Documento</th>
                    <th className="px-6 py-3.5">Contacto</th>
                    <th className="px-6 py-3.5">Fecha Registro</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPersons.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                        No se encontraron personas registradas en el directorio.
                      </td>
                    </tr>
                  ) : (
                    filteredPersons.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-100">
                              {p.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{p.fullName}</div>
                              <div className="text-[11px] text-slate-400">ID: {p.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-xs bg-slate-100 text-slate-700 font-medium border border-slate-200">
                            {p.documentType}-{p.documentNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          {p.email ? (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{p.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">Sin correo</span>
                          )}
                          {p.phone && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{p.phone}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setEditingPerson(p);
                              setPersonForm({
                                documentType: p.documentType,
                                documentNumber: p.documentNumber,
                                fullName: p.fullName,
                                email: p.email || "",
                                phone: p.phone || "",
                              });
                              setShowPersonModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title="Editar persona"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
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

      {/* TAB 2: OWNERSHIP BY UNIT */}
      {activeTab === "ownerships" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar unidad por código..."
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
            <div className="text-xs text-slate-500">
              Condominio actual: <strong>{condoDetails?.name || "Sin seleccionar"}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units
              .filter((u) => !unitSearch || u.code.toLowerCase().includes(unitSearch.toLowerCase()))
              .map((u) => (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md transition flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-sm border border-slate-200">
                          {u.code}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-slate-800">
                            {u.structureName || "Estructura"} — Piso {u.floor ?? "-"}
                          </div>
                          <div className="text-[11px] text-slate-400 capitalize">
                            Tipo: {u.type} · Alícuota: {u.aliquotPct}%
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {u.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Titular Asignado
                      </div>
                      <div className="text-xs text-slate-700 flex items-center justify-between">
                        <span>Estado:</span>
                        <span className="font-semibold text-indigo-600">Verificado</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedUnitForAssign(u);
                        setAssignForm({
                          personId: persons[0]?.id || "",
                          startDate: new Date().toISOString().split("T")[0],
                          isPrimaryResidence: true,
                        });
                        setShowAssignModal(true);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer text-center"
                    >
                      Asignar Titular
                    </button>

                    <button
                      onClick={() => handleViewHistory(u)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                      title="Ver Historial de Propietarios"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: RESIDENT LINK REQUESTS */}
      {activeTab === "requests" && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Bandeja de Solicitudes de Vinculación
              </h3>
              <p className="text-xs text-slate-400">
                Los residentes registrados solicitan acceso formal a su unidad para consultar sus cuotas y pagos.
              </p>
            </div>
            <button
              onClick={loadRequests}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              title="Actualizar bandeja"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Usuario Solicitante</th>
                  <th className="px-6 py-3.5">Condominio & Unidad</th>
                  <th className="px-6 py-3.5">Fecha de Solicitud</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Resolución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                      No hay solicitudes de vinculación registradas.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">
                          {r.user?.fullName || "Usuario"}
                        </div>
                        <div className="text-xs text-slate-400">{r.user?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">
                          {r.condominium?.name || condoDetails?.name}
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                          Unidad: {r.unitCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(r.requestedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {r.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pendiente</span>
                          </span>
                        )}
                        {r.status === "approved" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aprobada</span>
                          </span>
                        )}
                        {r.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rechazada</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {r.status === "pending" ? (
                          <>
                            <button
                              onClick={() => handleApproveRequest(r.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleRejectRequest(r.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                            >
                              Rechazar
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">Resuelta</span>
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

      {/* TAB 4: MY PROPERTIES */}
      {activeTab === "my_properties" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Propiedades Asociadas a Tu Usuario
              </h3>
              <p className="text-xs text-slate-400">
                Inmuebles en los cuales figuras como titular activo o residente verificado.
              </p>
            </div>
            <button
              onClick={() => setShowLinkRequestModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Vincular Otra Unidad</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProperties.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-200/80">
                <Home className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No tienes unidades residenciales asignadas aún.</p>
                <button
                  onClick={() => setShowLinkRequestModal(true)}
                  className="mt-3 text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  Solicitar vinculación con el código de tu apartamento
                </button>
              </div>
            ) : (
              myProperties.map((prop) => (
                <div
                  key={prop.ownershipId}
                  className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono text-sm font-bold border border-indigo-200">
                      Unidad {prop.unitCode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {prop.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-800">
                      {prop.condominiumName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {prop.structureName || "Estructura"} · {prop.condominiumAddress}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Titular desde: {prop.startDate}</span>
                    <button
                      onClick={() => {
                        setSelectedOwnershipForTransfer({
                          id: prop.ownershipId,
                          unitCode: prop.unitCode,
                        });
                        setTransferForm({
                          toPersonId: persons[0]?.id || "",
                          contractFileUrl: "",
                        });
                        setShowTransferModal(true);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Traspasar</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: NEW / EDIT PERSON */}
      {showPersonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                {editingPerson ? "Editar Persona" : "Registrar Nueva Persona"}
              </h3>
              <button
                onClick={() => setShowPersonModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePerson} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Eduardo Pérez"
                  value={personForm.fullName}
                  onChange={(e) => setPersonForm({ ...personForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tipo Doc.</label>
                  <select
                    value={personForm.documentType}
                    onChange={(e) => setPersonForm({ ...personForm, documentType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  >
                    <option value="V">V (Venezolano)</option>
                    <option value="E">E (Extranjero)</option>
                    <option value="J">J (Jurídico)</option>
                    <option value="P">P (Pasaporte)</option>
                    <option value="DNI">DNI</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700">Número de Documento *</label>
                  <input
                    type="text"
                    required
                    placeholder="12345678"
                    value={personForm.documentNumber}
                    onChange={(e) => setPersonForm({ ...personForm, documentNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="carlos@example.com"
                  value={personForm.email}
                  onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Teléfono Móvil</label>
                <input
                  type="text"
                  placeholder="+58 412 1234567"
                  value={personForm.phone}
                  onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPersonModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs transition cursor-pointer"
                >
                  {actionLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN OWNER */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                Asignar Titular a Unidad {selectedUnitForAssign?.code}
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignOwner} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Seleccionar Propietario *</label>
                <select
                  required
                  value={assignForm.personId}
                  onChange={(e) => setAssignForm({ ...assignForm, personId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="">-- Selecciona una persona --</option>
                  {persons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.documentType}-{p.documentNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Fecha de Inicio *</label>
                <input
                  type="date"
                  required
                  value={assignForm.startDate}
                  onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={assignForm.isPrimaryResidence}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, isPrimaryResidence: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPrimary" className="text-xs text-slate-700 font-medium">
                  Residencia principal de esta persona
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs transition cursor-pointer"
                >
                  {actionLoading ? "Asignando..." : "Asignar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TRANSFER OWNERSHIP */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                Traspaso de Propiedad (Unidad {selectedOwnershipForTransfer?.unitCode})
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nuevo Propietario / Destinatario *</label>
                <select
                  required
                  value={transferForm.toPersonId}
                  onChange={(e) => setTransferForm({ ...transferForm, toPersonId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="">-- Selecciona destinatario --</option>
                  {persons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.documentType}-{p.documentNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  URL / Enlace del Contrato de Traspaso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://minio.sgc.app/contratos/documento.pdf"
                  value={transferForm.contractFileUrl}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, contractFileUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-400">
                  Requisito de negocio (BR-032): se debe adjuntar el contrato legal de venta/traspaso.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs transition cursor-pointer"
                >
                  {actionLoading ? "Procesando..." : "Confirmar Traspaso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: HISTORY OF UNIT */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">
                  Historial de Propietarios — Unidad {historyUnit?.code}
                </h3>
                <p className="text-xs text-slate-400">
                  Registro cronológico de titularidades en esta unidad (BR-032)
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historyLoading ? (
                <div className="py-8 text-center text-slate-400">Cargando historial...</div>
              ) : historyList.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No hay registro histórico de propietarios para esta unidad.
                </div>
              ) : (
                historyList.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 text-xs sm:text-sm">
                        {h.person?.fullName || "Propietario"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Doc: {h.person?.documentType}-{h.person?.documentNumber} · Inicio: {h.startDate}
                        {h.endDate && ` · Fin: ${h.endDate}`}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        h.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {h.status === "active" ? "Titular Actual" : "Traspasado"}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SUBMIT RESIDENT LINK REQUEST */}
      {showLinkRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Vincular a Mi Unidad Residencial</h3>
              <button
                onClick={() => setShowLinkRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitLinkRequest} className="space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
                <p className="font-semibold">Condominio Seleccionado:</p>
                <p className="font-bold text-indigo-700">{condoDetails?.name}</p>
                <p className="text-[11px] text-indigo-600">{condoDetails?.address}</p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Código de tu Apartamento o Casa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 1-A, 1-B, 2-C..."
                  value={linkRequestForm.unitCode}
                  onChange={(e) =>
                    setLinkRequestForm({ ...linkRequestForm, unitCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-base font-bold text-slate-800 uppercase"
                />
                <p className="text-[11px] text-slate-400">
                  Introduce el código oficial con el que está registrada tu unidad.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLinkRequestModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs transition cursor-pointer"
                >
                  {actionLoading ? "Enviando..." : "Enviar Solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
