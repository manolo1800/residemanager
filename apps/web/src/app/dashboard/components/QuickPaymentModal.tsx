"use client";

import React, { useState } from "react";
import { CreditCard, CheckCircle2, AlertCircle, X } from "lucide-react";

interface QuickPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: any[];
  currencySymbol?: string;
  onPaymentSuccess?: (msg: string) => void;
}

export function QuickPaymentModal({
  isOpen,
  onClose,
  units,
  currencySymbol = "$",
  onPaymentSuccess,
}: QuickPaymentModalProps) {
  const [unitId, setUnitId] = useState("");
  const [concept, setConcept] = useState("Cuota de Mantenimiento Ordinaria");
  const [amount, setAmount] = useState("120.00");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onPaymentSuccess) {
          onPaymentSuccess(`Pago de ${currencySymbol}${amount} registrado con éxito.`);
        }
      }, 1200);
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Registrar Pago</h3>
              <p className="text-xs text-slate-500">Cobro de cuota o abono de propietario</p>
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
            <h4 className="font-bold text-emerald-800 text-sm">¡Pago Registrado!</h4>
            <p className="text-xs text-emerald-600">El recibo de pago ha sido emitido con éxito.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unidad Residencial / Propietario
              </label>
              <select
                required
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium"
              >
                <option value="">Selecciona una unidad...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} {u.structureName ? `(${u.structureName})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Concepto
              </label>
              <input
                type="text"
                required
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Monto ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium"
                >
                  <option value="transfer">Transferencia</option>
                  <option value="pago_movil">Pago Móvil / Zelle</option>
                  <option value="cash">Efectivo / Divisas</option>
                  <option value="card">Punto / Tarjeta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                N° de Referencia Bancaria (Opcional)
              </label>
              <input
                type="text"
                placeholder="ej: REF-984729"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono"
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
                className="px-5 py-2 bg-[#1e293b] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50"
              >
                {loading ? "Registrando..." : "Confirmar Pago"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
