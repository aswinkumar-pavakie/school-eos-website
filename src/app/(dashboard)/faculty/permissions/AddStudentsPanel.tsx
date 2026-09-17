"use client";

import { useEffect, useState } from "react";
import type { EventGrade, EventSection, EventStudentSearchResult } from "@/lib/faculty-permissions-api";
import { addParticipantAction, listSectionsAction, searchStudentsAction } from "./actions";

// Matches the mobile app's own "Add students" screen exactly (app/
// (protected)/events/[id]/add-students.tsx): search by name/roll number,
// filter by class then section, add one student at a time (the real backend
// has no bulk-add endpoint).
export function AddStudentsPanel({
  eventId,
  grades,
  existingStudentIds,
  onClose,
}: {
  eventId: string;
  grades: EventGrade[];
  existingStudentIds: Set<string>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [gradeId, setGradeId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [sections, setSections] = useState<EventSection[]>([]);
  const [results, setResults] = useState<EventStudentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!gradeId) {
      // setState must happen inside a callback, never synchronously in the
      // effect body (react-hooks/set-state-in-effect) -- a 0ms timeout keeps
      // this imperceptible to the user while satisfying that.
      const timer = setTimeout(() => setSections([]), 0);
      return () => clearTimeout(timer);
    }
    listSectionsAction(gradeId).then(setSections);
  }, [gradeId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const data = await searchStudentsAction(search.trim(), gradeId ?? undefined, sectionId ?? undefined).catch(() => []);
      setResults(data);
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, gradeId, sectionId]);

  async function handleAdd(student: EventStudentSearchResult) {
    setAddingId(student.id);
    const result = await addParticipantAction(eventId, student.id);
    setAddingId(null);
    if (!result.error) {
      setAddedIds((prev) => new Set(prev).add(student.id));
    }
  }

  return (
    <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 20, marginTop: 14 }}>
      <div className="flex items-center justify-between">
        <div style={{ font: "700 16px/1.2 var(--fac-font-sans)" }}>Add students</div>
        <button type="button" onClick={onClose} style={{ border: 0, background: "none", cursor: "pointer", color: "var(--fac-primary)", font: "600 13px/1 var(--fac-font-sans)" }}>
          Done
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or roll no."
        style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "12px 14px", font: "400 14px/1 var(--fac-font-sans)", marginTop: 14 }}
      />

      <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)", margin: "14px 0 8px" }}>CLASS</div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setGradeId(null); setSectionId(null); }}
          style={{ border: "1.5px solid var(--fac-border)", borderRadius: 999, padding: "8px 14px", font: "600 12.5px/1 var(--fac-font-sans)", background: !gradeId ? "var(--fac-primary)" : "var(--fac-white)", color: !gradeId ? "#fff" : "var(--fac-body)", borderColor: !gradeId ? "var(--fac-primary)" : "var(--fac-border)" }}
        >
          All classes
        </button>
        {grades.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => { setGradeId(g.id); setSectionId(null); }}
            style={{ border: "1.5px solid var(--fac-border)", borderRadius: 999, padding: "8px 14px", font: "600 12.5px/1 var(--fac-font-sans)", background: gradeId === g.id ? "var(--fac-primary)" : "var(--fac-white)", color: gradeId === g.id ? "#fff" : "var(--fac-body)", borderColor: gradeId === g.id ? "var(--fac-primary)" : "var(--fac-border)" }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {gradeId && sections.length > 0 && (
        <>
          <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)", margin: "14px 0 8px" }}>SECTION</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSectionId(null)}
              style={{ border: "1.5px solid var(--fac-border)", borderRadius: 999, padding: "8px 14px", font: "600 12.5px/1 var(--fac-font-sans)", background: !sectionId ? "var(--fac-primary)" : "var(--fac-white)", color: !sectionId ? "#fff" : "var(--fac-body)", borderColor: !sectionId ? "var(--fac-primary)" : "var(--fac-border)" }}
            >
              All sections
            </button>
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSectionId(s.id)}
                style={{ border: "1.5px solid var(--fac-border)", borderRadius: 999, padding: "8px 14px", font: "600 12.5px/1 var(--fac-font-sans)", background: sectionId === s.id ? "var(--fac-primary)" : "var(--fac-white)", color: sectionId === s.id ? "#fff" : "var(--fac-body)", borderColor: sectionId === s.id ? "var(--fac-primary)" : "var(--fac-border)" }}
              >
                Section {s.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 16, maxHeight: 320, overflow: "auto" }}>
        {loading ? (
          <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", textAlign: "center", padding: "16px 0" }}>Searching…</p>
        ) : results.length === 0 ? (
          <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", textAlign: "center", padding: "16px 0" }}>No students match.</p>
        ) : (
          results.map((s) => {
            const alreadyAdded = existingStudentIds.has(s.id) || addedIds.has(s.id);
            return (
              <div key={s.id} className="flex items-center gap-3" style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", font: "600 14.5px/1.3 var(--fac-font-sans)" }}>{[s.firstName, s.lastName].filter(Boolean).join(" ")}</span>
                  <span style={{ display: "block", font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                    Roll {s.rollNo ?? "--"} · {[s.gradeName, s.sectionName].filter(Boolean).join(" ") || "Class not assigned"} · {s.admissionNo}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleAdd(s)}
                  disabled={alreadyAdded || addingId === s.id}
                  style={{ border: 0, cursor: alreadyAdded ? "default" : "pointer", borderRadius: 9, padding: "9px 14px", font: "600 12.5px/1 var(--fac-font-sans)", background: alreadyAdded ? "var(--fac-divider)" : "var(--fac-primary)", color: alreadyAdded ? "var(--fac-body-muted)" : "#fff" }}
                >
                  {alreadyAdded ? "Added" : addingId === s.id ? "Adding…" : "Add"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
