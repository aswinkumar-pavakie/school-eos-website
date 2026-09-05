"use client";

import { useState } from "react";
import { AllocationsPanel, type Allocation } from "./AllocationsPanel";
import { HostelsPanel, type Hostel } from "./HostelsPanel";
import type { UnallocatedStudent } from "./UnallocatedStudentPicker";

const TABS = ["Hostels", "Allocations"] as const;
type Tab = (typeof TABS)[number];

export function HostelTabs({
  hostels,
  allocations,
  years,
  unallocatedStudents,
}: {
  hostels: Hostel[];
  allocations: Allocation[];
  years: { id: string; name: string; isCurrent: boolean }[];
  unallocatedStudents: UnallocatedStudent[];
}) {
  const [tab, setTab] = useState<Tab>("Hostels");

  return (
    <div>
      <div className="mt-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              tab === t ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-[16px] border border-border bg-surface p-[18px]">
        {tab === "Hostels" && <HostelsPanel hostels={hostels} />}
        {tab === "Allocations" && (
          <AllocationsPanel allocations={allocations} years={years} unallocatedStudents={unallocatedStudents} />
        )}
      </div>
    </div>
  );
}
