"use client";

import React, { useRef } from "react";
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  CreditCard,
  Hash,
  Home,
  ShieldCheck,
  FileCheck,
} from "lucide-react";

interface OfficialReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: any;
  currencySymbol?: string;
}

export function OfficialReceiptModal({
  isOpen,
  onClose,
  receiptData,
  currencySymbol = "$",
}: OfficialReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receiptData) return null;

  const { receiptNumber, issuedAt, condominium, payment, allocations } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  const isApproved =
    payment?.status === "approved" || payment?.status === "approved_pending_data";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in">
      {/* Styles for print output */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #official-receipt-print-area,
          #official-receipt-print-area * {
            visibility: visible;
          }
          #official-receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">
              Comprobante Oficial de Pago
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER */}
        <div
          id="official-receipt-print-area"
          ref={printRef}
          className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">
                    {condominium?.name || "Condominio Residencial"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Código: {condominium?.code} {condominium?.address ? `• ${condominium.address}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                {receiptNumber}
              </span>
              <p className="text-[11px] text-slate-400 font-medium">
                Emisión: {new Date(issuedAt).toLocaleDateString()} {new Date(issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Status & Overview Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Inmueble / Unidad</p>
              <p className="text-sm font-black text-slate-900">
                Unidad {payment?.unitCode}
              </p>
              <p className="text-xs text-slate-500 font-medium">{payment?.structureName || "Estructura Principal"}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Fecha de Pago</p>
              <p className="text-sm font-black text-slate-900">
                {payment?.paymentDate}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Registrado por: {payment?.origin === "resident" ? "Residente" : "Administración"}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Estado del Pago</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {payment?.status === "approved" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    APROBADO
                  </span>
                ) : payment?.status === "approved_pending_data" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    APROBADO (PEND. DATOS)
                  </span>
                ) : payment?.status === "pending" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                    EN REVISIÓN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                    RECHAZADO
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Allocation Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Desglose de Cuotas y Cargos Aplicados
            </h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="px-3.5 py-2.5">Período / Concepto</th>
                    <th className="px-3.5 py-2.5">Total Cuota</th>
                    <th className="px-3.5 py-2.5 text-right">Monto Aplicado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {allocations && allocations.length > 0 ? (
                    allocations.map((alloc: any, idx: number) => (
                      <tr key={alloc.id || idx} className="hover:bg-slate-50/50">
                        <td className="px-3.5 py-2 font-medium">
                          <span className="font-bold text-slate-900">Período {alloc.period}</span>
                          <span className="block text-[10px] text-slate-400">Cuota condominio regular</span>
                        </td>
                        <td className="px-3.5 py-2 text-slate-500">
                          {currencySymbol}
                          {alloc.chargeTotalAmount ? parseFloat(alloc.chargeTotalAmount).toFixed(2) : "0.00"}
                        </td>
                        <td className="px-3.5 py-2 text-right font-black text-slate-900">
                          {currencySymbol}
                          {parseFloat(alloc.amountApplied).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-3.5 py-3 text-center text-slate-400 italic">
                        Abono general a cuenta de la unidad residencial
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-black text-slate-900">
                  <tr>
                    <td colSpan={2} className="px-3.5 py-2.5 text-right uppercase text-[11px] text-slate-500">
                      Total Abonado:
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-base text-emerald-700">
                      {currencySymbol}
                      {parseFloat(payment?.amount || "0").toFixed(2)} {payment?.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Method & Reference Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Medio de Pago</span>
              <span className="font-bold text-slate-800">{payment?.methodName || "Transferencia / Depósito"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Referencia Bancaria</span>
              <span className="font-mono font-bold text-slate-800">{payment?.referenceNumber || "S/R (Efectivo/Caja)"}</span>
            </div>
            {payment?.exchangeRate && (
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tasa de Cambio</span>
                <span className="font-medium text-slate-700">{payment.exchangeRate}</span>
              </div>
            )}
          </div>

          {/* Security Seal & Signature */}
          <div className="pt-4 border-t border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                  Sello Digital de Validación
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  HASH: {payment?.id?.toUpperCase()}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">
                  Verificado por SGC Sistema de Gestión de Condominios
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1 mx-auto"></div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Administración
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs">
          <span className="text-slate-400">
            Documento de comprobación financiera interna.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimir Recibo</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
