"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { STATUS_LABELS, type ProjetoStatus } from "@/types/projeto";
import { oasisStatusColors, oasisChartTheme } from "@/lib/chart-theme";

type Datum = { name: string; value: number; status: ProjetoStatus };

export function StatusPie({ data }: { data: Array<{ status: ProjetoStatus; count: number }> }) {
  const chartData: Datum[] = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: STATUS_LABELS[d.status],
      value: d.count,
      status: d.status,
    }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-ink-mute">Sem dados.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={oasisStatusColors[entry.status]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: oasisChartTheme.tooltipBg,
            border: `1px solid ${oasisChartTheme.tooltipBorder}`,
            borderRadius: "12px",
            fontSize: "12px",
            color: oasisChartTheme.text,
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", color: oasisChartTheme.text }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
