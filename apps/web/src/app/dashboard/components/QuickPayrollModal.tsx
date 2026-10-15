"use client";

import React, { useState } from "react";
import { Users, CheckCircle2, X } from "lucide-react";

interface QuickPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
  condoId?: string;
  onPayrollSuccess?: (msg: string) => void;
}

export function QuickPayrollModal({
  isOpen,
  onClose,
  currencySymbol = "$",
  condoId,
  onPayrollSuccess,
}: QuickPayrollModalProps) {
  const [employeeName, setEmployeeName] = useState("");
  const [role, setRole] = useState("Conserje / Vigilante");
  const [salary, setSalary] = useState("350.00");
  const [frequency, setFrequency] = useState("biweekly");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (condoId) {
        const { fetchApi } = await import("../../../lib/api");
        await fetchApi(
          "/staff",
          {
            method: "POST",
            body: JSON.stringify({
              condominiumId: condoId,
              person: {
                documentType: "V",
                documentNumber: String(Math.floor(10000000 + Math.random() * 20000000)),
                fullName: employeeName || "Colaborador",
              },
              position: role,
              contractType: "individual",
              hireDate: new Date().toISOString().slice(0, 10),
              salary: salary,
              salaryCurrency: "USD",
              payFrequency: frequency,
              status: "active",
            }),
          },
          condoId
        );
      }
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onPayrollSuccess) {
          onPayrollSuccess(`Colaborador '${employeeName || "Colaborador"}' registrado en la nómina con éxito.`);
        }
      }, 1200);
    } catch (err: any) {
      setLoading(false);
      alert(err.message || "Error al registrar en nómina");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Agregar Personal / Nómina</h3>
              <p className="text-xs text-slate-500">Gestión de sueldos y personal del condominio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-bold text-emerald-800 text-sm">¡Registro de Nómina Guardado!</h4>
            <p className="text-xs text-emerald-600">El empleado y concepto de nómina quedaron registrados.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nombre del Trabajador / Empleado
              </label>
              <input
                type="text"
                required
                placeholder="ej: José Rodríguez"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cargo / Rol
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium"
                >
                  <option value="Conserje / Vigilante">Conserje / Vigilante</option>
                  <option value="Mantenimiento General">Mantenimiento General</option>
                  <option value="Jardinero">Jardinero</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Frecuencia
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium"
                >
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                  <option value="semanal">Semanal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Salario / Honorarios ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Registrar Nómina"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
