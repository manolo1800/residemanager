"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
} from "recharts";
import { ChevronDown, Download } from "lucide-react";

interface MonthlyData {
  month: string;
  spent: number;
  pctUsed: number;
  budget: number;
}

const DEFAULT_DATA: MonthlyData[] = [
  { month: "Jan", spent: 3480, pctUsed: 30, budget: 11600 },
  { month: "Feb", spent: 5220, pctUsed: 45, budget: 11600 },
  { month: "Mar", spent: 4060, pctUsed: 35, budget: 11600 },
  { month: "Apr", spent: 6960, pctUsed: 60, budget: 11600 },
  { month: "May", spent: 4640, pctUsed: 40, budget: 11600 },
  { month: "Jun", spent: 8700, pctUsed: 75, budget: 11600 },
  { month: "Jul", spent: 8320, pctUsed: 85, budget: 11600 },
  { month: "Aug", spent: 5800, pctUsed: 50, budget: 11600 },
  { month: "Sep", spent: 7540, pctUsed: 65, budget: 11600 },
  { month: "Oct", spent: 5220, pctUsed: 45, budget: 11600 },
  { month: "Nov", spent: 6380, pctUsed: 55, budget: 11600 },
  { month: "Dec", spent: 8120, pctUsed: 70, budget: 11600 },
];

interface MonthlyChartProps {
  currencySymbol?: string;
  availableAmount?: number;
}

export function MonthlyChart({
  currencySymbol = "$",
  availableAmount = 3280,
}: MonthlyChartProps) {
  const [activeIndex, setActiveIndex] = useState<number>(6); // Julio por defecto
  const [period, setPeriod] = useState<"Yearly" | "Monthly">("Yearly");

  const currentYear = new Date().getFullYear();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlyData = payload[0].payload;
      return (
        <div className="bg-[#1e293b] text-white p-3 rounded-xl shadow-2xl text-xs space-y-1 border border-slate-700/80 pointer-events-none relative">
          <div className="inline-block bg-white/20 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            {data.pctUsed}% Usado
          </div>
          <div className="font-bold text-sm text-white">
            {currencySymbol}
            {data.spent.toLocaleString()} gastado
          </div>
          <div className="text-[10px] text-slate-300">
            para {data.month} {currentYear}
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1e293b] rotate-45 border-r border-b border-slate-700" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800">
            Resumen mensual
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setPeriod((p) => (p === "Yearly" ? "Monthly" : "Yearly"))
              }
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition"
            >
              {period} <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              title="Descargar reporte"
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg transition"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
          {currencySymbol}
          {availableAmount.toLocaleString()}{" "}
          <span className="text-sm font-medium text-slate-500">disponible</span>
        </div>
      </div>

      <div className="w-full flex-1 min-h-[220px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={DEFAULT_DATA}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(226, 232, 240, 0.4)", radius: 6 }}
            />
            <Bar
              dataKey="spent"
              radius={[6, 6, 0, 0]}
              onClick={(_, index) => setActiveIndex(index)}
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {DEFAULT_DATA.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === activeIndex ? "#1e293b" : "#e2e8f0"}
                  className="transition-colors duration-200 cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
