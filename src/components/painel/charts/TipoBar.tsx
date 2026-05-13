"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { oasisChartPalette, oasisChartTheme } from "@/lib/chart-theme";

type Datum = { tipo: string; count: number };

export function TipoBar({ data }: { data: Datum[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-mute">Sem dados.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={oasisChartTheme.grid} />
        <XAxis
          dataKey="tipo"
          stroke={oasisChartTheme.axisLine}
          tick={{ fill: oasisChartTheme.text, fontSize: 11 }}
          tickLine={false}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis
          stroke={oasisChartTheme.axisLine}
          tick={{ fill: oasisChartTheme.text, fontSize: 11 }}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: oasisChartTheme.tooltipBg,
            border: `1px solid ${oasisChartTheme.tooltipBorder}`,
            borderRadius: "12px",
            fontSize: "12px",
            color: oasisChartTheme.text,
          }}
          cursor={{ fill: oasisChartTheme.cursor }}
        />
        <Bar dataKey="count" fill={oasisChartPalette[0]} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
