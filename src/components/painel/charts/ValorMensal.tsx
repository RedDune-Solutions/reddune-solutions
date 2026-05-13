"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { oasisChartPalette, oasisChartTheme } from "@/lib/chart-theme";

type Datum = { mes: string; valor: number };

export function ValorMensal({ data }: { data: Datum[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-mute">Sem dados.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={oasisChartTheme.grid} />
        <XAxis
          dataKey="mes"
          stroke={oasisChartTheme.axisLine}
          tick={{ fill: oasisChartTheme.text, fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          stroke={oasisChartTheme.axisLine}
          tick={{ fill: oasisChartTheme.text, fontSize: 11 }}
          tickLine={false}
          tickFormatter={(v) => `${v}€`}
        />
        <Tooltip
          contentStyle={{
            background: oasisChartTheme.tooltipBg,
            border: `1px solid ${oasisChartTheme.tooltipBorder}`,
            borderRadius: "12px",
            fontSize: "12px",
            color: oasisChartTheme.text,
          }}
          formatter={(v) => [`${Number(v).toFixed(0)}€`, "Valor estimado"]}
        />
        <Line
          type="monotone"
          dataKey="valor"
          stroke={oasisChartPalette[0]}
          strokeWidth={2.5}
          dot={{ fill: oasisChartPalette[0], r: 4 }}
          activeDot={{ r: 6, fill: oasisChartPalette[1] }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
