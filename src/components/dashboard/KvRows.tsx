import type { ReactNode } from "react";

// Shared label/value row list -- pixel-matches the row style inside
// TeacherProfileView's own local InfoCard (Principal Console.dc.html's
// teacherPage() mockup): 11px/700/uppercase muted label left, bold value
// right, hairline divider between rows, no divider after the last row. Used
// by ProfileInfoCard's 3-card grid and by any full-width profile section
// that's just a short label/value list (e.g. Login & security).

export type KvRow = [label: string, value: ReactNode] | false | null | undefined | "";

export function KvRows({ rows }: { rows: KvRow[] }) {
  const filtered = rows.filter((row): row is [string, ReactNode] => Boolean(row));
  return (
    <div className="mt-2 flex flex-col">
      {filtered.map(([label, value]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-[18px] border-b border-border py-[11px] last:border-b-0"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">{label}</span>
          <span className="text-right text-sm font-semibold text-text">{value}</span>
        </div>
      ))}
    </div>
  );
}
