"use client";

// Change-over-time line, single blue -- real session dates only, gap days
// (no session marked) are simply absent from the data rather than shown as 0%.

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK_MUTED, CHART_BLUE, GRID_STROKE } from "./chart-colors";

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function ReportLineChart({ data }: { data: { date: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: AXIS_TICK_MUTED }} tickLine={false} axisLine={false} />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11, fill: AXIS_TICK_MUTED }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, "Present"] as [string, string]}
          labelFormatter={(value) =>
            new Date(String(value)).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          }
          contentStyle={{ borderRadius: 10, border: `1px solid ${GRID_STROKE}`, fontSize: 12 }}
        />
        <Line type="monotone" dataKey="value" stroke={CHART_BLUE} strokeWidth={2.5} dot={{ r: 3, fill: CHART_BLUE }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
