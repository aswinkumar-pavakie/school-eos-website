"use client";

import { useState } from "react";
import { CoachesPanel, type Coach } from "./CoachesPanel";
import { EquipmentPanel, type Equipment } from "./EquipmentPanel";
import { SportsOversightPanel, type SportsOverview } from "./SportsOversightPanel";
import { SportsPanel, type Sport, type SportCategory } from "./SportsPanel";

const TABS = ["Sports", "Equipment", "Coaches", "Oversight"] as const;
type Tab = (typeof TABS)[number];

export function SportsTabs({
  sports,
  categoriesBySport,
  equipment,
  coaches,
  overview,
}: {
  sports: Sport[];
  categoriesBySport: Record<string, SportCategory[]>;
  equipment: Equipment[];
  coaches: Coach[];
  overview: SportsOverview | null;
}) {
  const [tab, setTab] = useState<Tab>("Sports");

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
        {tab === "Sports" && <SportsPanel sports={sports} categoriesBySport={categoriesBySport} />}
        {tab === "Equipment" && <EquipmentPanel equipment={equipment} sports={sports} />}
        {tab === "Coaches" && <CoachesPanel coaches={coaches} />}
        {tab === "Oversight" &&
          (overview ? (
            <SportsOversightPanel overview={overview} coaches={coaches} />
          ) : (
            <p className="py-6 text-center text-sm text-text-muted">Couldn&apos;t load oversight data — try refreshing the page.</p>
          ))}
      </div>
    </div>
  );
}
