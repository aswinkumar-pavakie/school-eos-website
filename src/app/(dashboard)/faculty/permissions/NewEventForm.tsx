"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TeacherSearchResult } from "@/lib/faculty-permissions-api";
import { createEventAction, searchTeachersAction } from "./actions";

// Matches the mobile app's own Events "Create event" screen exactly (app/
// (protected)/events/create.tsx): name, location, purpose, a real monitoring
// teacher search-select (never free text), and a from/to date+time. Students
// are added afterwards, as their own separate step, same as mobile -- there
// is no combined create-and-add-students endpoint in the real backend.
export function NewEventForm({ onClose }: { onClose: (eventId?: string) => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const [teacherQuery, setTeacherQuery] = useState("");
  const [teacherResults, setTeacherResults] = useState<TeacherSearchResult[]>([]);
  const [teacher, setTeacher] = useState<TeacherSearchResult | null>(null);
  const [teacherSearching, setTeacherSearching] = useState(false);

  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function runTeacherSearch(q: string) {
    setTeacherQuery(q);
    if (q.trim().length < 2) {
      setTeacherResults([]);
      return;
    }
    setTeacherSearching(true);
    const results = await searchTeachersAction(q).catch(() => []);
    setTeacherResults(results);
    setTeacherSearching(false);
  }

  async function handleSubmit() {
    setError(undefined);
    if (!name.trim() || !location.trim() || !purpose.trim()) {
      setError("Name, location and purpose are all required.");
      return;
    }
    if (!teacher) {
      setError("Search and select a monitoring teacher.");
      return;
    }
    if (!startsAt || !endsAt) {
      setError("Enter both a from and to date/time.");
      return;
    }
    const startIso = new Date(startsAt).toISOString();
    const endIso = new Date(endsAt).toISOString();
    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setError('The "to" date/time must be after the "from" date/time.');
      return;
    }

    setPending(true);
    const result = await createEventAction({
      name: name.trim(),
      location: location.trim(),
      purpose: purpose.trim(),
      monitoringTeacherPersonId: teacher.personId,
      startsAt: startIso,
      endsAt: endIso,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose(result.eventId);
  }

  return (
    <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 22 }}>
      <div className="flex items-center justify-between">
        <div style={{ font: "700 20px/1.25 var(--fac-font-sans)" }}>Create event</div>
        <button type="button" onClick={() => onClose()} style={{ width: 32, height: 32, border: "1px solid var(--fac-border)", background: "var(--fac-white)", borderRadius: 8, cursor: "pointer", color: "var(--fac-body-muted)" }}>
          ✕
        </button>
      </div>

      <div style={{ font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-body)", margin: "18px 0 8px" }}>Event name</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Science Museum Field Trip" style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />

      <div style={{ font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-body)", margin: "16px 0 8px" }}>Location</div>
      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. City Science Museum" style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />

      <div style={{ font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-body)", margin: "16px 0 8px" }}>Purpose</div>
      <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Why is this event being held?" style={{ width: "100%", minHeight: 80, border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1.6 var(--fac-font-sans)", resize: "vertical" }} />

      <div style={{ font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-body)", margin: "16px 0 8px" }}>Monitoring teacher</div>
      {teacher ? (
        <div className="flex items-center justify-between" style={{ border: "1px solid var(--fac-border)", borderRadius: 10, padding: "11px 14px" }}>
          <span style={{ font: "600 14px/1.3 var(--fac-font-sans)" }}>{[teacher.firstName, teacher.lastName].filter(Boolean).join(" ")}{teacher.designation ? ` · ${teacher.designation}` : ""}</span>
          <button type="button" onClick={() => setTeacher(null)} style={{ border: 0, background: "none", cursor: "pointer", color: "var(--fac-primary)", font: "600 13px/1 var(--fac-font-sans)" }}>
            Change
          </button>
        </div>
      ) : (
        <>
          <input value={teacherQuery} onChange={(e) => runTeacherSearch(e.target.value)} placeholder="Search staff by name" style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />
          {teacherSearching && <p style={{ font: "400 12px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 6 }}>Searching…</p>}
          {teacherResults.length > 0 && (
            <div style={{ border: "1px solid var(--fac-border)", borderRadius: 10, marginTop: 8, overflow: "hidden" }}>
              {teacherResults.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTeacher(t);
                    setTeacherResults([]);
                    setTeacherQuery("");
                  }}
                  className="flex w-full text-left"
                  style={{ border: 0, cursor: "pointer", padding: "11px 14px", borderBottom: "1px solid var(--fac-divider)", font: "500 14px/1 var(--fac-font-sans)", background: "var(--fac-white)" }}
                >
                  {[t.firstName, t.lastName].filter(Boolean).join(" ")}{t.designation ? ` · ${t.designation}` : ""}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-3.5" style={{ marginTop: 16 }}>
        <div>
          <div style={{ font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-body)", marginBottom: 8 }}>From</div>
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />
        </div>
        <div>
          <div style={{ font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-body)", marginBottom: 8 }}>To</div>
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />
        </div>
      </div>

      {error && <p style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-red-text)", marginTop: 12 }}>{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        style={{ width: "100%", marginTop: 18, border: 0, cursor: "pointer", borderRadius: 11, padding: 15, font: "600 15.5px/1 var(--fac-font-sans)", color: "#fff", background: "var(--fac-primary)", opacity: pending ? 0.7 : 1 }}
      >
        {pending ? "Creating…" : "Create event"}
      </button>
    </div>
  );
}
