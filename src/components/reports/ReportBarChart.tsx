"use client";

// Single-blue magnitude-across-categories bar -- horizontal layout so long real
// category labels (designations, route names, request types) never collide.

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK_MUTED, AXIS_TICK_TEXT, CHART_BLUE, GRID_STROKE } from "./chart-colors";

export function ReportBarChart({
  data,
  color = CHART_BLUE,
  valueLabel = "Count",
}: {
  data: { label: string; value: number }[];
  color?: string;
  valueLabel?: string;
}) {
  const height = Math.max(160, data.length * 36 + 24);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_TICK_MUTED }} allowDecimals={false} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={130}
          tick={{ fontSize: 12, fill: AXIS_TICK_TEXT }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) => [Number(value), valueLabel] as [number, string]}
          contentStyle={{ borderRadius: 10, border: `1px solid ${GRID_STROKE}`, fontSize: 12 }}
        />
        <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
