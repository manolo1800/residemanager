"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";

interface SavingsChartProps {
  currencySymbol?: string;
  savedAmount?: number;
  goalAmount?: number;
  onManageGoals?: () => void;
}

const SAVINGS_TREND = [
  { step: "Ene", amount: 2100 },
  { step: "Mar", amount: 3200 },
  { step: "May", amount: 3900 },
  { step: "Jul", amount: 4800 },
  { step: "Sep", amount: 5900 },
  { step: "Oct", amount: 6800 },
];

export function SavingsChart({
  currencySymbol = "$",
  savedAmount = 6800,
  goalAmount = 10000,
  onManageGoals,
}: SavingsChartProps) {
  const goalFormatted = goalAmount >= 1000 ? `${goalAmount / 1000}k` : goalAmount;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Progreso Fondo de Emergencia / Metas
        </h3>
        <button
          onClick={onManageGoals}
          className="text-xs text-slate-500 hover:text-sky-600 transition font-medium"
        >
          Gestionar Metas
        </button>
      </div>

      <div className="mb-2">
        <div className="text-2xl font-bold text-slate-900">
          {currencySymbol}
          {savedAmount.toLocaleString()}{" "}
          <span className="text-sm text-slate-400 font-normal">
            / {currencySymbol}
            {goalFormatted}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Fondo de reserva y contingencia acumulado
        </p>
      </div>

      <div className="w-full h-20 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={SAVINGS_TREND}
            margin={{ top: 5, right: 5, left: 5, bottom: 0 }}
          >
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value;
                  return (
                    <div className="bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-lg shadow-lg font-semibold">
                      {currencySymbol}
                      {val?.toLocaleString()}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#1e293b"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#savingsGrad)"
              dot={{ r: 3, fill: "#1e293b", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#10b981", stroke: "#1e293b", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
