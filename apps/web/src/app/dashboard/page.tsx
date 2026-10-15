"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Bell,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  LogOut,
  Calendar,
  Wallet,
  Receipt,
  FileSpreadsheet,
  Check,
  CreditCard,
  Building,
  TrendingDown,
  TrendingUp,
  Layers,
  ChevronDown,
  PieChart,
} from "lucide-react";
import { fetchApi, getCurrentUser, logout } from "../../lib/api";
import { MonthlyChart } from "./components/MonthlyChart";
import { SavingsChart } from "./components/SavingsChart";
import { UpcomingBills } from "./components/UpcomingBills";
import { SettingsView } from "./components/SettingsView";
import { QuickPaymentModal } from "./components/QuickPaymentModal";
import { QuickPayrollModal } from "./components/QuickPayrollModal";
import { ResidentsOwnersView } from "./components/ResidentsOwnersView";
import { ResidentPortalView } from "./components/ResidentPortalView";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [condos, setCondos] = useState<any[]>([]);
  const [selectedCondoId, setSelectedCondoId] = useState<string>("");
  const [activeNavTab, setActiveNavTab] = useState<
    "dashboard" | "owners" | "payroll" | "accounts" | "reports" | "settings" | "resident-portal"
  >("dashboard");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const isResidentOnly = Boolean(
    currentUser?.roles?.includes("resident") &&
    !currentUser?.isSuperAdmin &&
    !currentUser?.roles?.includes("tenant_admin") &&
    !currentUser?.roles?.includes("condo_admin")
  );

  // Helper para generar iniciales estilo Gmail (primera letra del nombre + primera letra del apellido)
  const getUserInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      if (parts.length === 1 && parts[0].length >= 2) {
        return parts[0].slice(0, 2).toUpperCase();
      }
      return (parts[0]?.[0] || "U").toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return "AD";
  };
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Data states
  const [structures, setStructures] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [commonAreas, setCommonAreas] = useState<any[]>([]);
  const [parkingSpots, setParkingSpots] = useState<any[]>([]);
  const [condoDetails, setCondoDetails] = useState<any>(null);

  // Modals
  const [showNewCondoModal, setShowNewCondoModal] = useState(false);
  const [showNewStructModal, setShowNewStructModal] = useState(false);
  const [showNewUnitModal, setShowNewUnitModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showNewAreaModal, setShowNewAreaModal] = useState(false);
  const [showNewParkingModal, setShowNewParkingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  // Editing state trackers
  const [editingStruct, setEditingStruct] = useState<any | null>(null);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const [editingArea, setEditingArea] = useState<any | null>(null);
  const [editingParking, setEditingParking] = useState<any | null>(null);

  // Forms
  const [newCondoForm, setNewCondoForm] = useState({
    code: "",
    name: "",
    type: "buildings",
    address: "",
    baseCurrency: "USD",
  });

  const [newStructForm, setNewStructForm] = useState<{
    name: string;
    kind: string;
    floors: number | string;
    position: number | string;
  }>({
    name: "",
    kind: "building",
    floors: 1,
    position: 0,
  });

  const [newUnitForm, setNewUnitForm] = useState<{
    code: string;
    structureId: string;
    floor: number | string;
    type: string;
    areaM2: string;
    aliquotPct: string;
    status: string;
  }>({
    code: "",
    structureId: "",
    floor: 1,
    type: "apartment",
    areaM2: "",
    aliquotPct: "",
    status: "active",
  });

  const [csvContent, setCsvContent] = useState(
    "codigo,estructura,piso,tipo,area,alicuota\n4-A,Torre A,4,apartment,125.00,2.750\n4-B,Torre A,4,apartment,125.00,2.750\n3-A,Torre B,3,apartment,110.00,2.400"
  );
  const [csvResult, setCsvResult] = useState<any>(null);

  const [newAreaForm, setNewAreaForm] = useState<{
    name: string;
    type: string;
    capacity: number | string;
  }>({
    name: "",
    type: "pool",
    capacity: 30,
  });

  const [newParkingForm, setNewParkingForm] = useState({
    code: "",
    type: "resident",
    assignedUnitId: "",
  });

  const [settingsForm, setSettingsForm] = useState<{
    baseCurrency: string;
    foreignCurrency: string;
    foreignCurrencyEnabled: boolean;
    taxExempt: boolean;
    taxRate: number | string;
    moraType: string;
    moraValue: number | string;
    partialPaymentsEnabled: boolean;
  }>({
    baseCurrency: "USD",
    foreignCurrency: "VES",
    foreignCurrencyEnabled: true,
    taxExempt: false,
    taxRate: 16,
    moraType: "percentage",
    moraValue: 5,
    partialPaymentsEnabled: true,
  });

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const notify = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  // Load user
  useEffect(() => {
    async function loadUser() {
      const stored = getCurrentUser();
      if (stored) {
        setCurrentUser(stored);
        if (
          stored.roles?.includes("resident") &&
          !stored.isSuperAdmin &&
          !stored.roles?.includes("tenant_admin") &&
          !stored.roles?.includes("condo_admin")
        ) {
          setActiveNavTab("resident-portal");
        }
      }
      try {
        const me = await fetchApi<any>("/auth/me");
        if (me) {
          setCurrentUser(me);
          if (
            me.roles?.includes("resident") &&
            !me.isSuperAdmin &&
            !me.roles?.includes("tenant_admin") &&
            !me.roles?.includes("condo_admin")
          ) {
            setActiveNavTab("resident-portal");
          }
        }
      } catch {
        // demo fallback
      }
    }
    loadUser();
  }, []);

  // 1. Load Condominiums
  useEffect(() => {
    async function loadCondos() {
      try {
        const list = await fetchApi<any[]>("/condominiums");
        setCondos(list);
        if (list.length > 0 && !selectedCondoId) {
          setSelectedCondoId(list[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load condominiums", err);
      }
    }
    loadCondos();
  }, [refreshTrigger]);

  // 2. Load Active Condominium Data
  useEffect(() => {
    if (!selectedCondoId) return;

    async function loadData() {
      try {
        const [condo, structList, unitRes, areaList, parkingList] =
          await Promise.all([
            fetchApi<any>(`/condominiums/${selectedCondoId}`),
            fetchApi<any[]>(`/condominiums/${selectedCondoId}/structures`),
            fetchApi<any>(`/condominiums/${selectedCondoId}/units?limit=100`),
            fetchApi<any[]>(`/condominiums/${selectedCondoId}/common-areas`),
            fetchApi<any[]>(`/condominiums/${selectedCondoId}/parking-spots`),
          ]);

        setCondoDetails(condo);
        setStructures(structList);
        setUnits(unitRes.items || []);
        setCommonAreas(areaList);
        setParkingSpots(parkingList);

        setSettingsForm({
          baseCurrency: condo.baseCurrency || "USD",
          foreignCurrency: condo.foreignCurrency || "VES",
          foreignCurrencyEnabled: condo.foreignCurrencyEnabled || false,
          taxExempt: condo.taxExempt || false,
          taxRate: condo.taxRate ? parseFloat(condo.taxRate) : 16,
          moraType: condo.moraType || "percentage",
          moraValue: condo.moraValue ? parseFloat(condo.moraValue) : 5,
          partialPaymentsEnabled: condo.partialPaymentsEnabled || false,
        });
      } catch (err: any) {
        notify(err.message, true);
      }
    }
    loadData();
  }, [selectedCondoId, refreshTrigger]);

  // Handlers
  const handleCreateCondo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await fetchApi<any>("/condominiums", {
        method: "POST",
        body: JSON.stringify(newCondoForm),
      });
      notify(`Condominio '${created.name}' creado con éxito`);
      setShowNewCondoModal(false);
      setSelectedCondoId(created.id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // 1. Structure Handlers
  const handleOpenNewStructModal = () => {
    setEditingStruct(null);
    setNewStructForm({
      name: "",
      kind: "building",
      floors: 1,
      position: 0,
    });
    setShowNewStructModal(true);
  };

  const handleEditStruct = (s: any) => {
    setEditingStruct(s);
    setNewStructForm({
      name: s.name || "",
      kind: s.kind || "building",
      floors: s.floors ?? 1,
      position: s.position ?? 0,
    });
    setShowNewStructModal(true);
  };

  const handleDeleteStruct = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la estructura '${name}'?`)) return;
    try {
      await fetchApi(`/condominiums/${selectedCondoId}/structures/${id}`, {
        method: "DELETE",
      });
      notify(`Estructura '${name}' eliminada`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newStructForm.name,
        kind: newStructForm.kind,
        floors: Number(newStructForm.floors) || null,
        position: Number(newStructForm.position) || 0,
      };

      if (editingStruct) {
        await fetchApi(`/condominiums/${selectedCondoId}/structures/${editingStruct.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        notify(`Estructura '${newStructForm.name}' actualizada con éxito`);
      } else {
        await fetchApi(`/condominiums/${selectedCondoId}/structures`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        notify("Estructura física creada con éxito");
      }

      setShowNewStructModal(false);
      setEditingStruct(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // 2. Unit Handlers
  const handleOpenNewUnitModal = () => {
    setEditingUnit(null);
    setNewUnitForm({
      code: "",
      structureId: "",
      floor: 1,
      type: "apartment",
      areaM2: "",
      aliquotPct: "",
      status: "active",
    });
    setShowNewUnitModal(true);
  };

  const handleEditUnit = (u: any) => {
    setEditingUnit(u);
    setNewUnitForm({
      code: u.code || "",
      structureId: u.structureId || "",
      floor: u.floor ?? 1,
      type: u.type || "apartment",
      areaM2: u.areaM2 ? String(u.areaM2) : "",
      aliquotPct: u.aliquotPct ? String(u.aliquotPct) : "",
      status: u.status || "active",
    });
    setShowNewUnitModal(true);
  };

  const handleDeleteUnit = async (id: string, code: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la unidad '${code}'?`)) return;
    try {
      await fetchApi(`/condominiums/${selectedCondoId}/units/${id}`, {
        method: "DELETE",
      });
      notify(`Unidad '${code}' eliminada`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: newUnitForm.code,
        structureId: newUnitForm.structureId || null,
        floor: newUnitForm.floor ? Number(newUnitForm.floor) : null,
        type: newUnitForm.type,
        areaM2: newUnitForm.areaM2 ? Number(newUnitForm.areaM2) : null,
        aliquotPct: newUnitForm.aliquotPct
          ? Number(newUnitForm.aliquotPct)
          : null,
        status: newUnitForm.status || "active",
      };

      if (editingUnit) {
        await fetchApi(`/condominiums/${selectedCondoId}/units/${editingUnit.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        notify(`Unidad '${newUnitForm.code}' actualizada con éxito`);
      } else {
        await fetchApi(`/condominiums/${selectedCondoId}/units`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        notify(`Unidad '${newUnitForm.code}' creada con éxito`);
      }

      setShowNewUnitModal(false);
      setEditingUnit(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await fetchApi<any>(
        `/condominiums/${selectedCondoId}/units/import`,
        {
          method: "POST",
          body: JSON.stringify({ csv: csvContent }),
        }
      );
      setCsvResult(result);
      notify(`Importación completada: ${result.totalCreated} unidades creadas`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // 3. Common Area Handlers
  const handleOpenNewAreaModal = () => {
    setEditingArea(null);
    setNewAreaForm({
      name: "",
      type: "pool",
      capacity: 30,
    });
    setShowNewAreaModal(true);
  };

  const handleEditArea = (a: any) => {
    setEditingArea(a);
    setNewAreaForm({
      name: a.name || "",
      type: a.type || "pool",
      capacity: a.capacity ?? 30,
    });
    setShowNewAreaModal(true);
  };

  const handleDeleteArea = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el área '${name}'?`)) return;
    try {
      await fetchApi(`/condominiums/${selectedCondoId}/common-areas/${id}`, {
        method: "DELETE",
      });
      notify(`Área común '${name}' eliminada`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleSaveCommonArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newAreaForm.name,
        type: newAreaForm.type,
        capacity: Number(newAreaForm.capacity) || null,
      };

      if (editingArea) {
        await fetchApi(`/condominiums/${selectedCondoId}/common-areas/${editingArea.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        notify(`Área común '${newAreaForm.name}' actualizada con éxito`);
      } else {
        await fetchApi(`/condominiums/${selectedCondoId}/common-areas`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        notify("Área común registrada con éxito");
      }

      setShowNewAreaModal(false);
      setEditingArea(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // 4. Parking Spot Handlers
  const handleOpenNewParkingModal = () => {
    setEditingParking(null);
    setNewParkingForm({
      code: "",
      type: "resident",
      assignedUnitId: "",
    });
    setShowNewParkingModal(true);
  };

  const handleEditParking = (p: any) => {
    setEditingParking(p);
    setNewParkingForm({
      code: p.code || "",
      type: p.type || "resident",
      assignedUnitId: p.assignedUnitId || "",
    });
    setShowNewParkingModal(true);
  };

  const handleDeleteParking = async (id: string, code: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el puesto '${code}'?`)) return;
    try {
      await fetchApi(`/condominiums/${selectedCondoId}/parking-spots/${id}`, {
        method: "DELETE",
      });
      notify(`Puesto '${code}' eliminado`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleSaveParking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: newParkingForm.code,
        type: newParkingForm.type,
        assignedUnitId: newParkingForm.assignedUnitId || null,
      };

      if (editingParking) {
        await fetchApi(`/condominiums/${selectedCondoId}/parking-spots/${editingParking.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        notify(`Puesto '${newParkingForm.code}' actualizado con éxito`);
      } else {
        await fetchApi(`/condominiums/${selectedCondoId}/parking-spots`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        notify(`Estacionamiento '${newParkingForm.code}' creado con éxito`);
      }

      setShowNewParkingModal(false);
      setEditingParking(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // 5. Condo General Details Handler
  const handleSaveCondoGeneral = async (condoData: {
    name: string;
    code: string;
    type: string;
    address: string;
  }) => {
    try {
      await fetchApi(`/condominiums/${selectedCondoId}`, {
        method: "PATCH",
        body: JSON.stringify(condoData),
      });
      notify("Datos del condominio actualizados con éxito");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi(`/condominiums/${selectedCondoId}/settings`, {
        method: "PATCH",
        body: JSON.stringify({
          ...settingsForm,
          taxRate:
            settingsForm.taxRate === "" ? null : Number(settingsForm.taxRate),
          moraValue:
            settingsForm.moraValue === "" ? 0 : Number(settingsForm.moraValue),
        }),
      });
      notify("Configuración operativa actualizada");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const currencySymbol =
    condoDetails?.baseCurrency === "EUR"
      ? "€"
      : condoDetails?.baseCurrency === "VES"
      ? "Bs."
      : "$";

  return (
    <div className="bg-gradient-to-br from-[#5a9fd4] via-[#4388c5] to-[#2d6ca3] min-h-screen text-[#1e293b] relative overflow-x-hidden flex flex-col">
      {/* Background radial glow effects */}
      <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Notifications */}
      {actionSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="fixed top-5 right-5 z-50 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{actionError}</span>
        </div>
      )}

      {/* Main Full-Screen Layout Container */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex-1 flex flex-col relative z-10">
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 sm:mb-10 relative z-20">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 text-white text-xl font-bold tracking-tight hover:opacity-90 transition"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 fill-white"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                </svg>
              </div>
              <span>SGC ResidManager</span>
            </Link>
          </div>

          {/* Navigation Bar */}
          {isResidentOnly ? (
            <nav className="flex items-center gap-2 sm:gap-4 overflow-x-auto max-w-full pb-1 md:pb-0">
              <button
                onClick={() => setActiveNavTab("resident-portal")}
                className={`text-xs sm:text-sm font-bold transition whitespace-nowrap px-5 py-2.5 rounded-full cursor-pointer flex items-center gap-2 ${
                  activeNavTab === "resident-portal"
                    ? "bg-emerald-500/30 text-white shadow-xs backdrop-blur-sm border border-emerald-400/40"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <span>Mi Portal de Residente</span>
              </button>
            </nav>
          ) : (
            <nav className="flex items-center gap-2 sm:gap-4 overflow-x-auto max-w-full pb-1 md:pb-0">
              <button
                onClick={() => setActiveNavTab("dashboard")}
                className={`text-xs sm:text-sm font-medium transition whitespace-nowrap px-4 py-2 rounded-full cursor-pointer ${
                  activeNavTab === "dashboard"
                    ? "bg-white/20 text-white shadow-xs backdrop-blur-sm"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setActiveNavTab("owners");
                }}
                className={`text-xs sm:text-sm font-medium transition whitespace-nowrap px-4 py-2 rounded-full cursor-pointer ${
                  activeNavTab === "owners"
                    ? "bg-white/20 text-white shadow-xs backdrop-blur-sm"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Residentes y Propietarios
              </button>
              <button
                onClick={() => setActiveNavTab("resident-portal")}
                className={`text-xs sm:text-sm font-medium transition whitespace-nowrap px-4 py-2 rounded-full cursor-pointer ${
                  activeNavTab === "resident-portal"
                    ? "bg-emerald-500/25 text-emerald-300 shadow-xs backdrop-blur-sm border border-emerald-400/30"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Vista Residente
              </button>
              <button
                onClick={() => setShowPayrollModal(true)}
                className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition whitespace-nowrap px-3 py-2 rounded-full cursor-pointer"
              >
                Nomina
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition whitespace-nowrap px-3 py-2 rounded-full cursor-pointer"
              >
                Cuentas y Transacciones
              </button>
              <button
                onClick={() => {
                  notify("Módulo de Reportes disponible en las próximas versiones.");
                }}
                className="text-xs sm:text-sm font-medium text-white/70 hover:text-white transition whitespace-nowrap px-3 py-2 rounded-full cursor-pointer"
              >
                Reportes
              </button>
              <button
                onClick={() => setActiveNavTab("settings")}
                className={`text-xs sm:text-sm font-medium transition whitespace-nowrap px-4 py-2 rounded-full cursor-pointer ${
                  activeNavTab === "settings"
                    ? "bg-white/20 text-white shadow-xs backdrop-blur-sm"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Configuraciones
              </button>
            </nav>
          )}

          {/* User actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRefreshTrigger((p) => p + 1)}
              title="Recargar datos"
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              title="Notificaciones"
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition shadow-xs"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Perfil de Usuario con Avatar estilo Gmail & Dropdown de Condominios y Sesión */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-white/50 transition focus:outline-none cursor-pointer"
                title={`${currentUser?.fullName || "Administrador"} — Cambiar condominio o cuenta`}
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName || "Usuario"}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/60 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center border-2 border-white/70 shadow-sm tracking-wider select-none">
                    {getUserInitials(currentUser?.fullName, currentUser?.email)}
                  </div>
                )}
              </button>

              {/* Menú Desplegable de Perfil */}
              {isProfileMenuOpen && (
                <>
                  {/* Backdrop para cerrar al hacer clic afuera */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />

                  <div className="absolute right-0 top-12 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 space-y-4">
                    {/* Cabecera del usuario estilo Gmail */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      {currentUser?.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-600 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shrink-0 tracking-wider shadow-inner">
                          {getUserInitials(currentUser?.fullName, currentUser?.email)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-slate-800 truncate">
                          {currentUser?.fullName || "Administrador"}
                        </p>
                        <p
                          className="text-xs text-slate-500 truncate"
                          title={currentUser?.email}
                        >
                          {currentUser?.email || "admin@sgc.app"}
                        </p>
                        <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          isResidentOnly
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}>
                          {isResidentOnly ? "Residente / Propietario" : "Administrador Principal"}
                        </span>
                      </div>
                    </div>

                    {/* Switch / Selector de Condominios */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Condominio Activo
                        </span>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            setShowNewCondoModal(true);
                          }}
                          className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Nuevo
                        </button>
                      </div>

                      <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                        {condos.map((c) => {
                          const isSelected = c.id === selectedCondoId;
                          return (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedCondoId(c.id);
                                setIsProfileMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition text-left ${
                                isSelected
                                  ? "bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs"
                                  : "hover:bg-slate-50 text-slate-700 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "bg-sky-600 text-white"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <div className="truncate">
                                  <p className="truncate leading-tight">
                                    {c.name}
                                  </p>
                                  <p className="text-[10px] font-normal text-slate-400 leading-none mt-0.5">
                                    {c.type === "houses"
                                      ? "Urbanización"
                                      : "Edificios"}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-sky-600 shrink-0 ml-1.5" />
                              )}
                            </button>
                          );
                        })}

                        {condos.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-2">
                            No hay condominios registrados
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cerrar Sesión */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => logout()}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition border border-rose-200/60"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ================= VISTA: DASHBOARD ================= */}
        {activeNavTab === "dashboard" && !isResidentOnly && (
          <div className="space-y-10 relative z-10 animate-in fade-in">
            {/* HERO SECTION */}
            <section className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
              <div className="text-white space-y-2 max-w-xl">
                <h2 className="text-white/85 text-xs sm:text-sm font-normal">
                  Planifica cada dólar, adelántate a las facturas y alcanza tus metas.
                </h2>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  ¡Crea un presupuesto mejor!
                </h1>

                {/* Hero Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-6 py-3 rounded-full bg-[#1e293b] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Calendar className="w-4 h-4" />
                    Registrar Pago
                  </button>
                  <button
                    onClick={() => setShowPayrollModal(true)}
                    className="px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-[#1e293b] text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Nominas
                  </button>
                </div>
              </div>

              {/* Hero Plan Glassmorphism Card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white w-full lg:w-[320px] shadow-xl space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider opacity-90">
                  <span>Presupuesto Octubre</span>
                  <span>24 Días</span>
                </div>
                <div className="text-3xl font-extrabold">
                  {currencySymbol}8,400{" "}
                  <span className="text-sm font-normal opacity-70">
                    / {currencySymbol}11,600
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    En meta este mes
                  </div>
                  <span className="text-xl font-extrabold">72%</span>
                </div>
              </div>
            </section>

            {/* --- GRID DE CONTENIDO PRINCIPAL --- */}
            <div className="space-y-6">
              {/* Bloque Superior: 4 KPIs a la izquierda + Gráfico Resumen Mensual a la derecha */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* 4 Tarjetas de Métricas en Grid 2x2 */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Tarjeta 1: Ingresos & Liquidez */}
                  <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Ingresos
                          <br />& Liquidez
                        </div>
                        <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                          <Wallet className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                        {currencySymbol}2,480{" "}
                        <span className="text-sm text-slate-400 font-normal">
                          / {currencySymbol}3,100
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-rose-500 flex items-center gap-1.5 pt-2 border-t border-slate-50">
                      <TrendingDown className="w-3.5 h-3.5" />
                      80% utilizado &bull; 7 días restantes
                    </div>
                  </div>

                  {/* Tarjeta 2: Gastos Operativos */}
                  <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Gastos
                          <br /> Operativos
                        </div>
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                        {currencySymbol}624{" "}
                        <span className="text-sm text-slate-400 font-normal">
                          / {currencySymbol}900
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 pt-2 border-t border-slate-50">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {currencySymbol}276 disponible este mes
                    </div>
                  </div>

                  {/* Tarjeta 3: Total Por cobrar */}
                  <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Total
                          <br />Por cobrar
                        </div>
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <CreditCard className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                        {currencySymbol}386{" "}
                        <span className="text-sm text-slate-400 font-normal">
                          / {currencySymbol}650
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 pt-2 border-t border-slate-50">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {currencySymbol}264 recuperado este mes
                    </div>
                  </div>

                  {/* Tarjeta 4: Fondo de Mantenimiento */}
                  <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Fondo de
                          <br />Mantenimiento
                        </div>
                        <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Building className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                        {currencySymbol}410{" "}
                        <span className="text-sm text-slate-400 font-normal">
                          / {currencySymbol}500
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-rose-500 flex items-center gap-1.5 pt-2 border-t border-slate-50">
                      <TrendingDown className="w-3.5 h-3.5" />
                      82% utilizado &bull; vigilar egresos
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Resumen Mensual (Chart Card) */}
                <div className="lg:col-span-1 h-full">
                  <MonthlyChart
                    currencySymbol={currencySymbol}
                    availableAmount={3280}
                  />
                </div>
              </div>

              {/* Bloque Inferior: 2 Columnas Balanceadas (Progreso de Fondos + Obligaciones por Vencer) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Progreso Fondo de Emergencia / Metas */}
                <div className="h-full">
                  <SavingsChart
                    currencySymbol={currencySymbol}
                    savedAmount={6800}
                    goalAmount={10000}
                    onManageGoals={() => setActiveNavTab("settings")}
                  />
                </div>

                {/* Facturas por Vencer / Calendario */}
                <div className="h-full">
                  <UpcomingBills
                    currencySymbol={currencySymbol}
                    onViewCalendar={() => {
                      notify("Calendario de vencimientos cargado.");
                    }}
                    onPayBill={(b) => {
                      setShowPaymentModal(true);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= VISTA: RESIDENTES Y PROPIETARIOS (FASE 3) ================= */}
        {activeNavTab === "owners" && (
          <div className="relative z-10 animate-in fade-in space-y-6">
            <ResidentsOwnersView
              condoDetails={condoDetails}
              units={units}
              currentUser={currentUser}
              notify={notify}
            />
          </div>
        )}

        {/* ================= VISTA: PORTAL DE RESIDENTE Y PROPIETARIO (AUTONOMO) ================= */}
        {(activeNavTab === "resident-portal" || (isResidentOnly && activeNavTab === "dashboard")) && (
          <div className="relative z-10 animate-in fade-in space-y-6">
            <ResidentPortalView
              currentUser={currentUser}
              notify={notify}
            />
          </div>
        )}

        {/* ================= VISTA: CONFIGURACIONES (ESTRUCTURAS, ESPACIOS, COBROS Y PAGOS) ================= */}
        {activeNavTab === "settings" && (
          <div className="relative z-10 animate-in fade-in space-y-6">
            <div className="flex items-center justify-between text-white pb-2">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Configuraciones del Condominio
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Administra las estructuras físicas, unidades residenciales,
                  áreas comunes, estacionamientos y las reglas financieras de
                  cobros y pagos.
                </p>
              </div>

              <button
                onClick={() => setActiveNavTab("dashboard")}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition"
              >
                Volver al Dashboard
              </button>
            </div>

            <SettingsView
              condoDetails={condoDetails}
              structures={structures}
              units={units}
              commonAreas={commonAreas}
              parkingSpots={parkingSpots}
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              handleSaveSettings={handleSaveSettings}
              handleSaveCondoGeneral={handleSaveCondoGeneral}
              onOpenNewStructModal={handleOpenNewStructModal}
              onEditStruct={handleEditStruct}
              onDeleteStruct={handleDeleteStruct}
              onOpenNewUnitModal={handleOpenNewUnitModal}
              onEditUnit={handleEditUnit}
              onDeleteUnit={handleDeleteUnit}
              onOpenCsvModal={() => setShowCsvModal(true)}
              onOpenNewAreaModal={handleOpenNewAreaModal}
              onEditArea={handleEditArea}
              onDeleteArea={handleDeleteArea}
              onOpenNewParkingModal={handleOpenNewParkingModal}
              onEditParking={handleEditParking}
              onDeleteParking={handleDeleteParking}
            />
          </div>
        )}
      </div>

      {/* ================= MODALES AUXILIARES ================= */}

      {/* 1. Modal: Registrar Pago Rápido */}
      <QuickPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        units={units}
        currencySymbol={currencySymbol}
        onPaymentSuccess={(msg) => notify(msg)}
      />

      {/* 2. Modal: Registrar Nómina Rápida */}
      <QuickPayrollModal
        isOpen={showPayrollModal}
        onClose={() => setShowPayrollModal(false)}
        currencySymbol={currencySymbol}
        onPayrollSuccess={(msg) => notify(msg)}
      />

      {/* 3. Modal: Crear Nuevo Condominio */}
      {showNewCondoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Crear Nuevo Condominio
              </h3>
              <p className="text-xs text-slate-500">
                Registra un nuevo complejo bajo tu administradora
              </p>
            </div>

            <form onSubmit={handleCreateCondo} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Código Único (Tenant)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: RES-PARK"
                  value={newCondoForm.code}
                  onChange={(e) =>
                    setNewCondoForm({ ...newCondoForm, code: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl uppercase font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Nombre del Condominio
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Residencias Parque Central"
                  value={newCondoForm.name}
                  onChange={(e) =>
                    setNewCondoForm({ ...newCondoForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Tipo de Complejo
                </label>
                <select
                  value={newCondoForm.type}
                  onChange={(e) =>
                    setNewCondoForm({ ...newCondoForm, type: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="buildings">
                    Edificios / Torres (Pisos y Apartamentos)
                  </option>
                  <option value="houses">
                    Casas / Urbanización (Bloques y Casas)
                  </option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Dirección</label>
                <input
                  type="text"
                  placeholder="ej: Av. Principal con Calle 4"
                  value={newCondoForm.address}
                  onChange={(e) =>
                    setNewCondoForm({
                      ...newCondoForm,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCondoModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
                >
                  Crear Condominio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Estructura Física (Crear / Editar) */}
      {showNewStructModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingStruct ? "Editar Estructura Física" : "Crear Estructura Física"}
            </h3>
            <form onSubmit={handleSaveStructure} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Torre C, Manzana B, Etapa 2"
                  value={newStructForm.name}
                  onChange={(e) =>
                    setNewStructForm({ ...newStructForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Tipo de Estructura
                </label>
                <select
                  value={newStructForm.kind}
                  onChange={(e) =>
                    setNewStructForm({ ...newStructForm, kind: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="building">Edificio / Torre</option>
                  <option value="block">Bloque / Manzana</option>
                  <option value="stage">Etapa / Sector</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Cantidad de Pisos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={
                      newStructForm.floors === "" ||
                      isNaN(Number(newStructForm.floors))
                        ? ""
                        : newStructForm.floors
                    }
                    onChange={(e) =>
                      setNewStructForm({
                        ...newStructForm,
                        floors:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Orden / Posición
                  </label>
                  <input
                    type="number"
                    value={
                      newStructForm.position === "" ||
                      isNaN(Number(newStructForm.position))
                        ? ""
                        : newStructForm.position
                    }
                    onChange={(e) =>
                      setNewStructForm({
                        ...newStructForm,
                        position:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewStructModal(false);
                    setEditingStruct(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
                >
                  {editingStruct ? "Actualizar Estructura" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Unidad (Crear / Editar) */}
      {showNewUnitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingUnit ? "Editar Unidad Residencial" : "Registrar Unidad"}
            </h3>
            <form onSubmit={handleSaveUnit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Código / Nomenclatura
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: 3-A, PH-1, Casa 14"
                  value={newUnitForm.code}
                  onChange={(e) =>
                    setNewUnitForm({ ...newUnitForm, code: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Estructura Asignada
                </label>
                <select
                  value={newUnitForm.structureId}
                  onChange={(e) =>
                    setNewUnitForm({
                      ...newUnitForm,
                      structureId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">(Sin estructura)</option>
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.kind})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tipo</label>
                  <select
                    value={newUnitForm.type}
                    onChange={(e) =>
                      setNewUnitForm({ ...newUnitForm, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="apartment">Apartamento</option>
                    <option value="house">Casa</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Piso</label>
                  <input
                    type="number"
                    value={
                      newUnitForm.floor === "" ||
                      isNaN(Number(newUnitForm.floor))
                        ? ""
                        : newUnitForm.floor
                    }
                    onChange={(e) =>
                      setNewUnitForm({
                        ...newUnitForm,
                        floor:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Área (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="120.50"
                    value={newUnitForm.areaM2}
                    onChange={(e) =>
                      setNewUnitForm({
                        ...newUnitForm,
                        areaM2: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Alícuota (%)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="2.500"
                    value={newUnitForm.aliquotPct}
                    onChange={(e) =>
                      setNewUnitForm({
                        ...newUnitForm,
                        aliquotPct: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Estado</label>
                <select
                  value={newUnitForm.status}
                  onChange={(e) =>
                    setNewUnitForm({
                      ...newUnitForm,
                      status: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewUnitModal(false);
                    setEditingUnit(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
                >
                  {editingUnit ? "Actualizar Unidad" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Importar CSV */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Importación Masiva de Unidades (CSV)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Formato esperado:{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">
                codigo,estructura,piso,tipo,area,alicuota
              </code>
            </p>

            <form onSubmit={handleImportCsv} className="space-y-4 text-xs">
              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {csvResult && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-emerald-600">
                      Creadas: {csvResult.totalCreated}
                    </span>
                    <span className="text-slate-500">
                      Procesadas: {csvResult.totalProcessed}
                    </span>
                    <span className="text-rose-600">
                      Errores: {csvResult.errors.length}
                    </span>
                  </div>
                  {csvResult.errors.length > 0 && (
                    <div className="max-h-28 overflow-y-auto space-y-1">
                      {csvResult.errors.map((err: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-[11px] text-rose-600 bg-rose-50 p-1.5 rounded-lg"
                        >
                          Fila {err.row} ({err.code}): {err.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCsvModal(false);
                    setCsvResult(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
                >
                  Procesar Importación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Área Común (Crear / Editar) */}
      {showNewAreaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingArea ? "Editar Área Común" : "Registrar Área Común"}
            </h3>
            <form onSubmit={handleSaveCommonArea} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Cancha de Tenis, Parque Infantil"
                  value={newAreaForm.name}
                  onChange={(e) =>
                    setNewAreaForm({ ...newAreaForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Tipo</label>
                <select
                  value={newAreaForm.type}
                  onChange={(e) =>
                    setNewAreaForm({ ...newAreaForm, type: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="pool">Piscina</option>
                  <option value="gym">Gimnasio</option>
                  <option value="party_room">Salón de Fiestas / Eventos</option>
                  <option value="park">Parque / Jardín</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Capacidad Máxima (personas)
                </label>
                <input
                  type="number"
                  value={
                    newAreaForm.capacity === "" ||
                    isNaN(Number(newAreaForm.capacity))
                      ? ""
                      : newAreaForm.capacity
                  }
                  onChange={(e) =>
                    setNewAreaForm({
                      ...newAreaForm,
                      capacity:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAreaModal(false);
                    setEditingArea(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
                >
                  {editingArea ? "Actualizar Área" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal: Puesto de Estacionamiento (Crear / Editar) */}
      {showNewParkingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingParking ? "Editar Puesto de Estacionamiento" : "Registrar Puesto de Estacionamiento"}
            </h3>
            <form onSubmit={handleSaveParking} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Código del Puesto
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: E-05, P-12, V-03"
                  value={newParkingForm.code}
                  onChange={(e) =>
                    setNewParkingForm({
                      ...newParkingForm,
                      code: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl uppercase font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Tipo</label>
                <select
                  value={newParkingForm.type}
                  onChange={(e) =>
                    setNewParkingForm({
                      ...newParkingForm,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="resident">Residente</option>
                  <option value="visitor">Visitante</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Asignar a Unidad (Opcional)
                </label>
                <select
                  value={newParkingForm.assignedUnitId}
                  onChange={(e) =>
                    setNewParkingForm({
                      ...newParkingForm,
                      assignedUnitId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">(Sin asignar / Visitante)</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} {u.structureName ? `(${u.structureName})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewParkingModal(false);
                    setEditingParking(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
                >
                  {editingParking ? "Actualizar Puesto" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
