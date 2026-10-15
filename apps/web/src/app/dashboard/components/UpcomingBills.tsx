"use client";

import React from "react";
import { Calendar, CheckCircle2, Clock } from "lucide-react";

interface BillItem {
  id: string;
  title: string;
  dueDate: string;
  status: "Planned" | "Pending" | "Urgent";
  amount: number;
}

interface UpcomingBillsProps {
  currencySymbol?: string;
  bills?: BillItem[];
  onViewCalendar?: () => void;
  onPayBill?: (bill: BillItem) => void;
}

const DEFAULT_BILLS: BillItem[] = [
  {
    id: "1",
    title: "Mantenimiento de Ascensores (Schindler)",
    dueDate: "Vence 1 de Noviembre",
    status: "Planned",
    amount: 1850.0,
  },
  {
    id: "2",
    title: "Servicio Eléctrico Áreas Comunes",
    dueDate: "Vence 8 de Noviembre",
    status: "Pending",
    amount: 420.5,
  },
  {
    id: "3",
    title: "Químicos y Mantenimiento de Piscina",
    dueDate: "Vence 12 de Noviembre",
    status: "Planned",
    amount: 280.0,
  },
];

export function UpcomingBills({
  currencySymbol = "$",
  bills = DEFAULT_BILLS,
  onViewCalendar,
  onPayBill,
}: UpcomingBillsProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800">
          Próximas Obligaciones / Facturas por Vencer
        </h3>
        <button
          onClick={onViewCalendar}
          className="text-xs text-slate-500 hover:text-sky-600 transition font-medium"
        >
          Ver Calendario
        </button>
      </div>

      <div className="space-y-3">
        {bills.slice(0, 3).map((bill) => (
          <div
            key={bill.id}
            className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/70 transition rounded-xl border border-slate-100"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-slate-600 shrink-0">
                <Calendar className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">
                    {bill.title}
                  </h4>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      bill.status === "Planned"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {bill.status === "Planned" ? "Planificado" : "Pendiente"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {bill.dueDate}
                </p>
              </div>
            </div>

            <div className="text-right pl-3 shrink-0">
              <div className="text-sm sm:text-base font-extrabold text-slate-900">
                {currencySymbol}
                {bill.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
