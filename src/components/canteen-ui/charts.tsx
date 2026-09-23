"use client";

// Canteen dashboard's real charts -- recharts, same axis/tooltip/grid
// styling convention as src/components/reports/Report*Chart.tsx (that
// module's own established pattern for this app), just using this portal's
// own --can-primary blue instead of the Reports module's CHART_BLUE, since
// Canteen has its own separate token set (canteen-theme.css).
//
// Both bar charts highlight one bar distinctly rather than rendering a flat
// single-color series: WeeklySalesChart picks out TODAY (the one bar a
// vendor glancing at "this week" actually cares about first), and
// HourlySalesChart picks out the real busiest hour in amber (ties directly
// to the "Busiest at ___" callout above it on the dashboard page) -- a
// purposeful visual cue, not decoration.

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoneyDetail, formatMoneySummary } from "@/lib/format";

const CAN_BLUE = "#1f6feb";
const CAN_BLUE_LIGHT = "#bfdbfe";
const CAN_AMBER = "#f59e0b";
const GRID_STROKE = "#eaecf0";
const AXIS_TICK_MUTED = "#98a2b3";

// Same fixed-order categorical palette this app's own Reports module uses
// (src/components/reports/chart-colors.ts) -- reused directly rather than
// inventing a second one for this single donut.
const CATEGORICAL_PALETTE = ["#2b6fe0", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];

function shortDay(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", { weekday: "short" });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function WeeklySalesChart({ data }: { data: { date: string; totalPaise: number }[] }) {
  const today = todayIso();
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDay} tick={{ fontSize: 11, fill: AXIS_TICK_MUTED }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={(v: number) => formatMoneySummary(v)} tick={{ fontSize: 11, fill: AXIS_TICK_MUTED }} tickLine={false} axisLine={false} width={64} />
        <Tooltip
          formatter={(value) => [formatMoneyDetail(value as number), "Sales"] as [string, string]}
          labelFormatter={(value) =>
            `${new Date(String(value)).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}${value === today ? " (today)" : ""}`
          }
          contentStyle={{ borderRadius: 10, border: `1px solid ${GRID_STROKE}`, fontSize: 12 }}
        />
        <Bar dataKey="totalPaise" radius={[6, 6, 0, 0]} maxBarSize={36}>
          {data.map((d) => (
            <Cell key={d.date} fill={d.date === today ? CAN_BLUE : CAN_BLUE_LIGHT} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Reports' own date-ranged trend -- same visual language as
// WeeklySalesChart but no fixed 7-day/"today" highlight, since a report's
// range is arbitrary (a custom From/To pair).
export function RangeSalesChart({ data }: { data: { date: string; totalPaise: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          tick={{ fontSize: 11, fill: AXIS_TICK_MUTED }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tickFormatter={(v: number) => formatMoneySummary(v)} tick={{ fontSize: 11, fill: AXIS_TICK_MUTED }} tickLine={false} axisLine={false} width={64} />
        <Tooltip
          formatter={(value) => [formatMoneyDetail(value as number), "Sales"] as [string, string]}
          labelFormatter={(value) => new Date(String(value)).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          contentStyle={{ borderRadius: 10, border: `1px solid ${GRID_STROKE}`, fontSize: 12 }}
        />
        <Bar dataKey="totalPaise" radius={[6, 6, 0, 0]} maxBarSize={28} fill={CAN_BLUE} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function hourLabel(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "am" : "pm"}`;
}

export function HourlySalesChart({ data, peakHour }: { data: { hour: number; totalPaise: number }[]; peakHour: number | null }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="hour" tickFormatter={hourLabel} tick={{ fontSize: 11, fill: AXIS_TICK_MUTED }} tickLine={false} axisLine={false} interval={1} />
        <YAxis tickFormatter={(v: number) => formatMoneySummary(v)} tick={{ fontSize: 11, fill: AXIS_TICK_MUTED }} tickLine={false} axisLine={false} width={64} />
        <Tooltip
          formatter={(value) => [formatMoneyDetail(value as number), "Sales"] as [string, string]}
          labelFormatter={(value) => `${hourLabel(Number(value))}${Number(value) === peakHour ? " (busiest)" : ""}`}
          contentStyle={{ borderRadius: 10, border: `1px solid ${GRID_STROKE}`, fontSize: 12 }}
        />
        <Bar dataKey="totalPaise" radius={[6, 6, 0, 0]} maxBarSize={28}>
          {data.map((d) => (
            <Cell key={d.hour} fill={peakHour !== null && d.hour === peakHour ? CAN_AMBER : CAN_BLUE} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// "Sales by class" donut -- real answer to "what should I stock more of",
// the top 5 grades + an "Other" bucket the backend already folds the rest
// into (CanteenService.getDashboard()'s own gradeBreakdown).
export function GradeBreakdownDonut({ data }: { data: { gradeName: string; totalPaise: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.totalPaise, 0);
  const slices = data.map((d, i) => ({ ...d, color: CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length] }));

  if (total === 0) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center", font: "500 13.5px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>
        No sales yet today.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <ResponsiveContainer width={150} height={150} style={{ flexShrink: 0 }}>
        <PieChart>
          <Pie data={slices} dataKey="totalPaise" nameKey="gradeName" innerRadius={46} outerRadius={70} paddingAngle={2} strokeWidth={0}>
            {slices.map((slice) => (
              <Cell key={slice.gradeName} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [formatMoneyDetail(value as number), "Sales"] as [string, string]}
            contentStyle={{ borderRadius: 10, border: `1px solid ${GRID_STROKE}`, fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul style={{ display: "flex", flex: 1, minWidth: 160, flexDirection: "column", gap: 8 }}>
        {slices.map((slice) => (
          <li key={slice.gradeName} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, font: "500 13px/1.2 var(--can-font-sans)", color: "var(--can-ink)" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: slice.color, flexShrink: 0 }} />
              {slice.gradeName}
            </span>
            <span style={{ font: "600 12px/1 var(--can-font-mono)", color: "var(--can-tertiary)" }}>
              {Math.round((slice.totalPaise / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
