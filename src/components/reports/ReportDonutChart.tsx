"use client";

// Simple-composition-with-few-parts donut, plus a visible legend (required for
// every chart with 2+ segments) -- a custom legend list, not recharts' default,
// so it matches this app's own type scale/colors exactly.

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function ReportDonutChart({ data }: { data: DonutSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width={160} height={160} className="shrink-0">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={48} outerRadius={72} paddingAngle={2} strokeWidth={0}>
            {data.map((slice) => (
              <Cell key={slice.label} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [Number(value), String(name)] as [number, string]}
            contentStyle={{ borderRadius: 10, border: "1px solid #eaecf0", fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex w-full flex-1 flex-col gap-1.5">
        {data.map((slice) => (
          <li key={slice.label} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2 text-text">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              {slice.label}
            </span>
            <span className="font-mono font-semibold text-text-muted">
              {slice.value}
              {total > 0 ? ` (${Math.round((slice.value / total) * 100)}%)` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
