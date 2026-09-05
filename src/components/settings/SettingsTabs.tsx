"use client";

import { useState } from "react";
import { SchoolProfilePanel, type School } from "./SchoolProfilePanel";
import { RolesPanel, type Role } from "./RolesPanel";
import { RetentionPoliciesPanel, type RetentionPolicy } from "./RetentionPoliciesPanel";
import { TerminalsPanel, type Terminal, type Vehicle } from "./TerminalsPanel";

const TABS = ["School profile", "Roles", "Document retention", "Terminals"] as const;
type Tab = (typeof TABS)[number];

export function SettingsTabs({
  school,
  roles,
  policies,
  terminals,
  vehicles,
}: {
  school: School;
  roles: Role[];
  policies: RetentionPolicy[];
  terminals: Terminal[];
  vehicles: Vehicle[];
}) {
  const [tab, setTab] = useState<Tab>("School profile");

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
        {tab === "School profile" && <SchoolProfilePanel school={school} />}
        {tab === "Roles" && <RolesPanel roles={roles} />}
        {tab === "Document retention" && <RetentionPoliciesPanel policies={policies} />}
        {tab === "Terminals" && <TerminalsPanel terminals={terminals} vehicles={vehicles} />}
      </div>
    </div>
  );
}
