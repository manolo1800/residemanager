"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Home as HomeIcon,
  TreePine,
  Car,
  Sliders,
  Plus,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Coins,
  Building2,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";

interface SettingsViewProps {
  condoDetails: any;
  structures: any[];
  units: any[];
  commonAreas: any[];
  parkingSpots: any[];
  settingsForm: {
    baseCurrency: string;
    foreignCurrency: string;
    foreignCurrencyEnabled: boolean;
    taxExempt: boolean;
    taxRate: number | string;
    moraType: string;
    moraValue: number | string;
    partialPaymentsEnabled: boolean;
  };
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
  handleSaveSettings: (e: React.FormEvent) => Promise<void>;
  handleSaveCondoGeneral?: (condoData: any) => Promise<void>;
  onOpenNewStructModal: () => void;
  onEditStruct?: (struct: any) => void;
  onDeleteStruct?: (id: string, name: string) => void;
  onOpenNewUnitModal: () => void;
  onEditUnit?: (unit: any) => void;
  onDeleteUnit?: (id: string, code: string) => void;
  onOpenCsvModal: () => void;
  onOpenNewAreaModal: () => void;
  onEditArea?: (area: any) => void;
  onDeleteArea?: (id: string, name: string) => void;
  onOpenNewParkingModal: () => void;
  onEditParking?: (parking: any) => void;
  onDeleteParking?: (id: string, code: string) => void;
}

export function SettingsView({
  condoDetails,
  structures,
  units,
  commonAreas,
  parkingSpots,
  settingsForm,
  setSettingsForm,
  handleSaveSettings,
  handleSaveCondoGeneral,
  onOpenNewStructModal,
  onEditStruct,
  onDeleteStruct,
  onOpenNewUnitModal,
  onEditUnit,
  onDeleteUnit,
  onOpenCsvModal,
  onOpenNewAreaModal,
  onEditArea,
  onDeleteArea,
  onOpenNewParkingModal,
  onEditParking,
  onDeleteParking,
}: SettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "condo" | "structures" | "units" | "common-areas" | "parking" | "finance"
  >("condo");

  const [unitSearch, setUnitSearch] = useState("");
  const [selectedStructureFilter, setSelectedStructureFilter] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingCondo, setSavingCondo] = useState(false);

  const [condoForm, setCondoForm] = useState({
    name: "",
    code: "",
    type: "buildings",
    address: "",
  });

  useEffect(() => {
    if (condoDetails) {
      setCondoForm({
        name: condoDetails.name || "",
        code: condoDetails.code || "",
        type: condoDetails.type || "buildings",
        address: condoDetails.address || "",
      });
    }
  }, [condoDetails]);

  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      !unitSearch || u.code.toLowerCase().includes(unitSearch.toLowerCase());
    const matchesStruct =
      !selectedStructureFilter || u.structureId === selectedStructureFilter;
    return matchesSearch && matchesStruct;
  });

  const onSubmitFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await handleSaveSettings(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const onSubmitCondo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleSaveCondoGeneral) return;
    setSavingCondo(true);
    try {
      await handleSaveCondoGeneral(condoForm);
    } finally {
      setSavingCondo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200/80 flex flex-wrap gap-1.5 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab("condo")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === "condo"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Datos del Condominio</span>
        </button>

        <button
          onClick={() => setActiveSubTab("structures")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === "structures"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Estructuras Físicas ({structures.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("units")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === "units"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <HomeIcon className="w-4 h-4" />
          <span>Unidades Residenciales ({units.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("common-areas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === "common-areas"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <TreePine className="w-4 h-4" />
          <span>Áreas Comunes ({commonAreas.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("parking")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === "parking"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Estacionamientos ({parkingSpots.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("finance")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === "finance"
              ? "bg-[#1e293b] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Configuraciones de Cobros y Pagos</span>
        </button>
      </div>

      {/* SUB-TAB 0: CONDOMINIO (DATOS GENERALES) */}
      {activeSubTab === "condo" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Datos Generales del Condominio
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Información de identificación, nomenclatura legal y dirección física del condominio.
            </p>
          </div>

          <form onSubmit={onSubmitCondo} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Condominio
                </label>
                <input
                  type="text"
                  required
                  value={condoForm.name}
                  onChange={(e) =>
                    setCondoForm({ ...condoForm, name: e.target.value })
                  }
                  placeholder="ej: Residencias Altamira Park"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código / Identificador / RIF
                </label>
                <input
                  type="text"
                  required
                  value={condoForm.code}
                  onChange={(e) =>
                    setCondoForm({ ...condoForm, code: e.target.value.toUpperCase() })
                  }
                  placeholder="ej: ALT-01, J-12345678-9"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Condominio
                </label>
                <select
                  value={condoForm.type}
                  onChange={(e) =>
                    setCondoForm({ ...condoForm, type: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="buildings">Edificios / Torres Residenciales</option>
                  <option value="houses">Conjunto Residencial de Casas / Villas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dirección Física
                </label>
                <input
                  type="text"
                  value={condoForm.address}
                  onChange={(e) =>
                    setCondoForm({ ...condoForm, address: e.target.value })
                  }
                  placeholder="ej: Av. Francisco de Miranda, Caracas"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingCondo}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingCondo ? "Guardando..." : "Guardar Datos del Condominio"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 1: ESTRUCTURAS */}
      {activeSubTab === "structures" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Estructuras Físicas del Complejo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Edificios, torres, bloques o etapas que estructuran las propiedades.
              </p>
            </div>
            <button
              onClick={onOpenNewStructModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Nueva Estructura
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {structures.map((s) => (
              <div
                key={s.id}
                className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 group hover:border-sky-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {s.kind === "building" ? "Edificio / Torre" : s.kind === "block" ? "Bloque" : s.kind === "stage" ? "Etapa" : s.kind}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1.5">
                      {s.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      #{s.position}
                    </div>
                    {onEditStruct && (
                      <button
                        type="button"
                        onClick={() => onEditStruct(s)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition shadow-2xs"
                        title="Editar estructura"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteStruct && (
                      <button
                        type="button"
                        onClick={() => onDeleteStruct(s.id, s.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition shadow-2xs"
                        title="Eliminar estructura"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Pisos
                    </span>
                    <span className="font-semibold text-slate-700">
                      {s.floors || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Unidades Asignadas
                    </span>
                    <span className="font-semibold text-sky-600">
                      {s.unitsCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {structures.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400 text-xs">
                No hay estructuras registradas aún en este condominio.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: UNIDADES & PROPIEDADES */}
      {activeSubTab === "units" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Unidades Residenciales & Propiedades
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Apartamentos y casas registrados con alícuota y metraje.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCsvModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <Upload className="w-4 h-4" />
                Importar CSV
              </button>
              <button
                onClick={onOpenNewUnitModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                Nueva Unidad
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar código (ej: 4-A)..."
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <select
                value={selectedStructureFilter}
                onChange={(e) => setSelectedStructureFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="">Todas las estructuras</option>
                {structures.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-slate-500 whitespace-nowrap">
              Mostrando {filteredUnits.length} de {units.length} unidades
            </span>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Estructura</th>
                  <th className="py-3 px-4">Piso</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Área (m²)</th>
                  <th className="py-3 px-4">Alícuota (%)</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {u.code}
                    </td>
                    <td className="py-3 px-4 font-medium text-sky-600">
                      {u.structureName || "—"}
                    </td>
                    <td className="py-3 px-4">{u.floor ?? "—"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {u.type === "house" ? "Casa" : "Apartamento"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {u.areaM2 ? `${u.areaM2} m²` : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {u.aliquotPct ? `${u.aliquotPct}%` : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          u.status === "inactive"
                            ? "bg-slate-100 text-slate-600 border-slate-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {u.status === "inactive" ? "Inactiva" : "Activa"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {onEditUnit && (
                          <button
                            type="button"
                            onClick={() => onEditUnit(u)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition"
                            title="Editar unidad"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteUnit && (
                          <button
                            type="button"
                            onClick={() => onDeleteUnit(u.id, u.code)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                            title="Eliminar unidad"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUnits.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      No hay unidades registradas o que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ÁREAS COMUNES */}
      {activeSubTab === "common-areas" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Áreas Comunes</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Piscinas, canchas, salones de fiestas y gimnasios del complejo.
              </p>
            </div>
            <button
              onClick={onOpenNewAreaModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Nueva Área Común
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {commonAreas.map((area) => (
              <div
                key={area.id}
                className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 group hover:border-sky-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <TreePine className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {area.type}
                    </span>
                    {onEditArea && (
                      <button
                        type="button"
                        onClick={() => onEditArea(area)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition shadow-2xs"
                        title="Editar área"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteArea && (
                      <button
                        type="button"
                        onClick={() => onDeleteArea(area.id, area.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition shadow-2xs"
                        title="Eliminar área"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  {area.name}
                </h4>
                <div className="text-xs text-slate-500">
                  Capacidad máxima:{" "}
                  <span className="font-bold text-slate-800">
                    {area.capacity ? `${area.capacity} personas` : "Ilimitada"}
                  </span>
                </div>
              </div>
            ))}

            {commonAreas.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-400 text-xs">
                No hay áreas comunes registradas aún.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ESTACIONAMIENTOS */}
      {activeSubTab === "parking" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Puestos de Estacionamiento
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Asignación a residentes y puestos de visitantes.
              </p>
            </div>
            <button
              onClick={onOpenNewParkingModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Nuevo Puesto
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {parkingSpots.map((p) => (
              <div
                key={p.id}
                className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 text-center space-y-1 hover:border-sky-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold text-xs mb-2">
                    <Car className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-black text-slate-900">{p.code}</div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      p.type === "resident"
                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {p.type === "resident" ? "Residente" : "Visitante"}
                  </span>
                  {p.assignedUnitCode && (
                    <div className="text-[10px] text-slate-500 font-medium pt-1">
                      Unidad: {p.assignedUnitCode}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-1 pt-2 border-t border-slate-200/70 mt-2">
                  {onEditParking && (
                    <button
                      type="button"
                      onClick={() => onEditParking(p)}
                      className="p-1 text-slate-400 hover:text-sky-600 hover:bg-white rounded-md transition"
                      title="Editar puesto"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDeleteParking && (
                    <button
                      type="button"
                      onClick={() => onDeleteParking(p.id, p.code)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition"
                      title="Eliminar puesto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {parkingSpots.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-400 text-xs">
                No hay puestos de estacionamiento registrados aún.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: COBROS Y PAGOS (CONFIGURACIÓN FINANCIERA) */}
      {activeSubTab === "finance" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Configuraciones de Cobros y Pagos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Moneda base, multimoneda extranjera, reglas de recargo por mora,
              tasas impositivas y abonos parciales.
            </p>
          </div>

          <form onSubmit={onSubmitFinance} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Moneda Base
                </label>
                <input
                  type="text"
                  value={settingsForm.baseCurrency}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      baseCurrency: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Moneda Extranjera / Alternativa
                </label>
                <input
                  type="text"
                  value={settingsForm.foreignCurrency}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      foreignCurrency: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="foreignEnabled"
                checked={settingsForm.foreignCurrencyEnabled}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    foreignCurrencyEnabled: e.target.checked,
                  })
                }
                className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
              />
              <label
                htmlFor="foreignEnabled"
                className="text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Habilitar pagos y balances en multimoneda (conversión automática)
              </label>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tasa de Impuestos / IVA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={
                    settingsForm.taxRate === "" ||
                    isNaN(Number(settingsForm.taxRate))
                      ? ""
                      : settingsForm.taxRate
                  }
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      taxRate: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Interés / Mora por Cobro Tardío (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={
                    settingsForm.moraValue === "" ||
                    isNaN(Number(settingsForm.moraValue))
                      ? ""
                      : settingsForm.moraValue
                  }
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      moraValue:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="partialEnabled"
                checked={settingsForm.partialPaymentsEnabled}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    partialPaymentsEnabled: e.target.checked,
                  })
                }
                className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
              />
              <label
                htmlFor="partialEnabled"
                className="text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Permitir pagos parciales o abonos a cuotas
              </label>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {savingSettings
                ? "Guardando..."
                : "Guardar Configuración Financiera"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
