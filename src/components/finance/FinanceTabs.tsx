"use client";

import { useState } from "react";
import { FeeHeadsPanel, type FeeHead } from "./FeeHeadsPanel";
import { FeeStructuresPanel, type AcademicYear, type FeeStructure, type Grade, type Medium } from "./FeeStructuresPanel";

const TABS = ["Fee Heads", "Fee Structures"] as const;
type Tab = (typeof TABS)[number];

export function FinanceTabs({
  feeHeads,
  feeStructures,
  academicYears,
  grades,
  mediums,
  filters,
  initialTab,
}: {
  feeHeads: FeeHead[];
  feeStructures: FeeStructure[];
  academicYears: AcademicYear[];
  grades: Grade[];
  mediums: Medium[];
  filters: { academicYearId?: string; gradeId?: string; state?: string };
  initialTab: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto">
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
        {tab === "Fee Heads" && <FeeHeadsPanel feeHeads={feeHeads} />}
        {tab === "Fee Structures" && (
          <FeeStructuresPanel
            feeStructures={feeStructures}
            academicYears={academicYears}
            grades={grades}
            mediums={mediums}
            filters={filters}
          />
        )}
      </div>
    </div>
  );
}
