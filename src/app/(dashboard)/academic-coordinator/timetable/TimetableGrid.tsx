"use client";

// Pixel-rebuilt from the design's own "isTimetable" screen -- a single global
// edit-mode toggle turns every cell in the whole week into a <select> at
// once (matching the design's own ttEditing state machine exactly), then one
// "Save draft" submits every changed cell in one go via the real
// upsertTimetableSlot endpoint (looped server-side, since the backend has no
// bulk-save route -- see actions.ts). Publish uses the real, already-proven
// publishTimetable call unchanged.

import { useMemo, useState, useTransition } from "react";
import { useFlash } from "@/components/academic-coordinator-ui/FlashContext";
import { PrimaryButton, SecondaryButton, StatusPill } from "@/components/academic-coordinator-ui/primitives";
import type { CoordinatorOffering, CoordinatorTimetablePeriod, CoordinatorTimetableSlot } from "@/lib/faculty-coordinator-api";
import { deleteSlotAction, publishTimetableAction, saveDraftSlotsAction } from "./actions";

const DAYS = [
  [1, "MON"],
  [2, "TUE"],
  [3, "WED"],
  [4, "THU"],
  [5, "FRI"],
  [6, "SAT"],
] as const;

export function TimetableGrid({
  sectionId,
  sectionLabel,
  periods,
  slots,
  offerings,
  occupancy,
}: {
  sectionId: string;
  sectionLabel: string;
  periods: CoordinatorTimetablePeriod[];
  slots: CoordinatorTimetableSlot[];
  offerings: CoordinatorOffering[];
  /** teacherStaffId -> every "day|periodId" they're already occupying in
   * some OTHER section (published or draft) -- real cross-section conflict
   * data, computed server-side in page.tsx. */
  occupancy: Record<string, string[]>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<Record<string, string>>({});
  const [saving, startTransition] = useTransition();
  const { showFlash } = useFlash();

  const draftCount = slots.filter((s) => s.isDraft).length;
  const hasSlots = slots.length > 0;
  const status = !hasSlots ? { label: "Not started", tone: "gray" as const } : draftCount > 0 ? { label: "Draft", tone: "amber" as const } : { label: "Published", tone: "green" as const };
  const offeringTeacher = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of offerings) if (o.teacherStaffId) map.set(o.subjectOfferingId, o.teacherStaffId);
    return map;
  }, [offerings]);
  const slotByCell = useMemo(() => {
    const map = new Map<string, CoordinatorTimetableSlot>();
    for (const s of slots) map.set(`${s.dayOfWeek}|${s.periodId}`, s);
    return map;
  }, [slots]);

  function clashesElsewhere(day: number, periodId: string, subjectOfferingId: string): boolean {
    if (!subjectOfferingId) return false;
    const teacherStaffId = offeringTeacher.get(subjectOfferingId);
    if (!teacherStaffId) return false;
    return (occupancy[teacherStaffId] ?? []).includes(`${day}|${periodId}`);
  }

  function cellKey(day: number, periodId: string) {
    return `${day}|${periodId}`;
  }

  function save() {
    const entries = Object.entries(pending)
      .filter(([, v]) => v)
      .map(([key, subjectOfferingId]) => {
        const [day, periodId] = key.split("|");
        return { dayOfWeek: Number(day), periodId, subjectOfferingId };
      });
    if (entries.length === 0) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await saveDraftSlotsAction(sectionId, entries);
      if (result.error) {
        showFlash(result.error);
        return;
      }
      showFlash(`Saved ${entries.length} period${entries.length === 1 ? "" : "s"} as draft.`);
      setPending({});
      setEditing(false);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!editing ? (
          <>
            <SecondaryButton type="button" onClick={() => setEditing(true)}>
              Edit timetable
            </SecondaryButton>
            {draftCount > 0 && (
              <PrimaryButton
                type="button"
                disabled={saving}
                onClick={() =>
                  startTransition(async () => {
                    await publishTimetableAction(sectionId);
                    showFlash(`Published ${draftCount} draft${draftCount === 1 ? "" : "s"}.`);
                  })
                }
              >
                Publish {draftCount} draft{draftCount === 1 ? "" : "s"}
              </PrimaryButton>
            )}
          </>
        ) : (
          <>
            <PrimaryButton type="button" disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save draft"}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              disabled={saving}
              onClick={() => {
                setPending({});
                setEditing(false);
              }}
            >
              Cancel
            </SecondaryButton>
          </>
        )}
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "20px 22px", overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "var(--acc-navy)" }}>Class {sectionLabel} timetable</div>
            <div style={{ fontSize: 13, color: "var(--acc-body-muted)", marginTop: 4 }}>
              {offerings.length} subject offering{offerings.length === 1 ? "" : "s"} · {draftCount} draft period{draftCount === 1 ? "" : "s"}
            </div>
          </div>
          <StatusPill label={status.label} tone={status.tone} />
        </div>
        <div style={{ minWidth: 1040 }}>
          <div style={{ display: "grid", gridTemplateColumns: `74px repeat(${periods.length}, minmax(124px, 1fr))`, gap: 8, paddingBottom: 10, borderBottom: "1px solid var(--acc-divider)" }}>
            <div />
            {periods.map((p) => (
              <div key={p.periodId}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--acc-navy)" }}>{p.label ?? `P${p.periodNo}`}</div>
                <div style={{ fontFamily: "var(--acc-font-mono)", fontSize: 10.5, color: "var(--acc-tertiary)", marginTop: 3 }}>
                  {p.startTime.slice(0, 5)}
                </div>
              </div>
            ))}
          </div>
          {DAYS.map(([day, label]) => (
            <div key={day} style={{ display: "grid", gridTemplateColumns: `74px repeat(${periods.length}, minmax(124px, 1fr))`, gap: 8, padding: "9px 0", borderBottom: "1px solid var(--acc-divider-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", fontSize: 13.5, fontWeight: 800, color: "var(--acc-navy)" }}>{label}</div>
              {periods.map((p) => {
                if (p.isBreak) {
                  return (
                    <div key={p.periodId} style={{ border: "1px solid var(--acc-divider)", background: "var(--acc-panel)", borderRadius: 10, padding: "10px 11px", minHeight: 62, fontSize: 11.5, fontStyle: "italic", color: "var(--acc-tertiary)" }}>
                      {p.label ?? "Break"}
                    </div>
                  );
                }
                const slot = slotByCell.get(cellKey(day, p.periodId));
                const key = cellKey(day, p.periodId);
                if (editing) {
                  const currentValue = pending[key] ?? slot?.subjectOfferingId ?? "";
                  const clash = clashesElsewhere(day, p.periodId, currentValue);
                  return (
                    <div key={p.periodId} style={{ border: "1px solid var(--acc-btn-border)", borderRadius: 10, padding: "10px 11px", minHeight: 62 }}>
                      <select
                        value={currentValue}
                        onChange={(e) => setPending((prev) => ({ ...prev, [key]: e.target.value }))}
                        style={{ width: "100%", border: "1px solid var(--acc-btn-border)", borderRadius: 8, padding: "7px 6px", fontSize: 11.5, color: "var(--acc-navy)", fontWeight: 600, background: "#fff" }}
                      >
                        <option value="">Free</option>
                        {offerings.map((o) => (
                          <option key={o.subjectOfferingId} value={o.subjectOfferingId}>
                            {o.subjectName} · {o.teacherName ?? "Unassigned"}
                          </option>
                        ))}
                      </select>
                      {clash && <div style={{ fontSize: 10.5, color: "var(--acc-navy)", fontWeight: 700, marginTop: 6 }}>Teacher busy elsewhere</div>}
                    </div>
                  );
                }
                return (
                  <div key={p.periodId} style={{ border: "1px solid var(--acc-border)", background: slot ? "#fff" : "var(--acc-panel-2)", borderRadius: 10, padding: "10px 11px", minHeight: 62 }}>
                    {slot ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--acc-navy)", lineHeight: 1.25 }}>
                          {slot.subjectName}
                          {slot.isDraft && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "var(--acc-amber)" }}>DRAFT</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--acc-body-muted)", marginTop: 5 }}>{slot.teacherName ?? "Unassigned"}</div>
                        {slot.isDraft && (
                          <button
                            type="button"
                            onClick={() =>
                              startTransition(async () => {
                                await deleteSlotAction(slot.slotId);
                              })
                            }
                            style={{ all: "unset", cursor: "pointer", fontSize: 10.5, fontWeight: 700, color: "var(--acc-red)", marginTop: 4, display: "block" }}
                          >
                            Remove
                          </button>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 11.5, color: "var(--acc-tertiary)" }}>Free</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)", marginTop: 14 }}>Publishing a class timetable writes every period into the teachers&rsquo; timetables automatically.</div>
      </div>
    </div>
  );
}
