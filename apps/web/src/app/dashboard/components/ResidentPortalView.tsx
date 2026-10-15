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
} from "lucide-react";
import { fetchApi } from "../../../lib/api";

interface ResidentPortalViewProps {
  currentUser: any;
  notify: (msg: string, isError?: boolean) => void;
}

export function ResidentPortalView({ currentUser, notify }: ResidentPortalViewProps) {
  const [activeTab, setActiveTab] = useState<"properties" | "search_link" | "requests">("properties");

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Data
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);

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

  const loadPortalData = async () => {
    try {
      setLoading(true);
      const [props, reqs] = await Promise.all([
        fetchApi<any[]>("/me/properties").catch(() => []),
        fetchApi<any[]>("/resident-link-requests").catch(() => []),
      ]);
      setMyProperties(props || []);
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
