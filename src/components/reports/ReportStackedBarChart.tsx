"use client";

// Hostel occupancy -- stacked bar, occupied (primary blue) vs vacant (muted
// neutral, NOT the categorical palette). 2 series, so it carries a visible legend.

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK_MUTED, AXIS_TICK_TEXT, CHART_BLUE, GRID_STROKE, NEUTRAL_MUTED } from "./chart-colors";

function legendLabel(value: unknown): string {
  return value === "occupied" ? "Occupied" : "Vacant";
}

export function ReportStackedBarChart({ data }: { data: { label: string; occupied: number; vacant: number }[] }) {
  const height = Math.max(180, data.length * 40 + 40);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_TICK_MUTED }} allowDecimals={false} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 12, fill: AXIS_TICK_TEXT }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: `1px solid ${GRID_STROKE}`, fontSize: 12 }}
          formatter={(value, name) => [Number(value), legendLabel(name)] as [number, string]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} formatter={legendLabel} />
        <Bar dataKey="occupied" stackId="beds" fill={CHART_BLUE} name="occupied" maxBarSize={20} />
        <Bar dataKey="vacant" stackId="beds" fill={NEUTRAL_MUTED} name="vacant" radius={[0, 6, 6, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
