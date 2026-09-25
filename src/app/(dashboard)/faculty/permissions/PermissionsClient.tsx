"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { NewEventForm } from "./NewEventForm";
import { AddStudentsPanel } from "./AddStudentsPanel";
import { deleteEventAction, removeParticipantAction } from "./actions";
import type { EventGrade, StudentEvent, StudentEventDetail } from "@/lib/faculty-permissions-api";

const STATE_LABEL: Record<string, string> = {
  PENDING: "Waiting for approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// Matches the mobile app's own Events screens exactly -- a flat list of
// events (no invented tabs), a create step, a separate add-students step,
// and the same three real participant states.
export function PermissionsClient({
  events,
  detail,
  grades,
}: {
  events: StudentEvent[];
  detail: StudentEventDetail | null;
  grades: EventGrade[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [addingStudents, setAddingStudents] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Ask permissions</h1>
          <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
            Create and manage student event permissions
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          style={{ border: 0, background: "var(--fac-primary)", color: "#fff", cursor: "pointer", font: "600 14.5px/1 var(--fac-font-sans)", borderRadius: 9, padding: "13px 22px" }}
        >
          {creating ? "Cancel" : "+ Create event"}
        </button>
      </div>

      {creating ? (
        <div style={{ marginTop: 18 }}>
          <NewEventForm
            onClose={(eventId) => {
              setCreating(false);
              if (eventId) router.push(`/faculty/permissions?eventId=${eventId}`);
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]" style={{ marginTop: 18, alignItems: "start" }}>
          <div className="flex flex-col gap-3">
            {events.length === 0 ? (
              <FacultyEmptyState message="No events yet. Create one above." />
            ) : (
              events.map((e) => {
                const active = e.id === detail?.id;
                return (
                  <a
                    key={e.id}
                    href={`/faculty/permissions?eventId=${e.id}`}
                    className="fac-hover-lift flex items-center gap-3.5"
                    style={{ border: "1px solid var(--fac-border)", borderRadius: 12, padding: "16px 18px", background: active ? "var(--fac-tint)" : "var(--fac-white)" }}
                  >
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", font: "700 16px/1.3 var(--fac-font-sans)" }}>{e.name}</span>
                      <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>{e.location}</span>
                      <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 2 }}>
                        {new Date(e.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
                        {new Date(e.startsAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} –{" "}
                        {new Date(e.endsAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                      </span>
                      <span style={{ display: "block", font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 2 }}>
                        Monitoring teacher: {e.monitoringTeacherName}
                      </span>
                    </span>
                  </a>
                );
              })
            )}
          </div>

          {detail && (
            <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 22 }}>
              <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)" }}>LOCATION</div>
              <div style={{ font: "600 14.5px/1.4 var(--fac-font-sans)", marginTop: 4 }}>{detail.location}</div>
              <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)", marginTop: 12 }}>WHEN</div>
              <div style={{ font: "600 14.5px/1.4 var(--fac-font-sans)", marginTop: 4 }}>
                {new Date(detail.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
                {new Date(detail.startsAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} –{" "}
                {new Date(detail.endsAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
              </div>
              <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)", marginTop: 12 }}>PURPOSE</div>
              <div style={{ font: "400 14.5px/1.5 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 4 }}>{detail.purpose}</div>
              <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)", marginTop: 12 }}>MONITORING TEACHER</div>
              <div style={{ font: "600 14.5px/1.4 var(--fac-font-sans)", marginTop: 4 }}>
                {detail.monitoringTeacherName}{detail.monitoringTeacherDesignation ? ` · ${detail.monitoringTeacherDesignation}` : ""}
              </div>

              <form
                action={async () => {
                  await deleteEventAction(detail.id);
                  router.push("/faculty/permissions");
                }}
                style={{ marginTop: 16 }}
              >
                <button type="submit" style={{ border: 0, background: "none", cursor: "pointer", color: "var(--fac-red-text)", font: "600 13.5px/1 var(--fac-font-sans)", padding: 0 }}>
                  Delete event
                </button>
              </form>

              <button
                type="button"
                onClick={() => setAddingStudents((v) => !v)}
                style={{ width: "100%", marginTop: 16, border: 0, cursor: "pointer", background: "var(--fac-primary)", color: "#fff", font: "600 14.5px/1 var(--fac-font-sans)", borderRadius: 11, padding: "14px 0" }}
              >
                {addingStudents ? "Close" : "+ Add students"}
              </button>

              {addingStudents && (
                <AddStudentsPanel
                  eventId={detail.id}
                  grades={grades}
                  existingStudentIds={new Set(detail.participants.map((p) => p.studentId))}
                  onClose={() => {
                    setAddingStudents(false);
                    router.refresh();
                  }}
                />
              )}

              <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", margin: "20px 0 6px" }}>
                STUDENTS ({detail.participants.length})
              </div>
              {detail.participants.length === 0 ? (
                <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", padding: "8px 0" }}>No students added yet.</p>
              ) : (
                detail.participants.map((p) => (
                  <div key={p.id} className="fac-hover-lift flex items-start gap-3.5" style={{ padding: "12px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", font: "600 14.5px/1.3 var(--fac-font-sans)" }}>{p.studentName}</span>
                      <span style={{ display: "block", font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                        Roll {p.rollNo ?? "--"} · {[p.gradeName, p.sectionName].filter(Boolean).join(" ") || "Class not assigned"}
                      </span>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 8,
                          font: "600 11.5px/1 var(--fac-font-sans)",
                          letterSpacing: ".03em",
                          borderRadius: 20,
                          padding: "6px 11px",
                          background: p.state === "APPROVED" ? "var(--fac-tint)" : p.state === "REJECTED" ? "var(--fac-red-bg)" : "var(--fac-divider)",
                          color: p.state === "APPROVED" ? "var(--fac-primary)" : p.state === "REJECTED" ? "var(--fac-red-text)" : "var(--fac-body)",
                        }}
                      >
                        {STATE_LABEL[p.state] ?? p.state}
                      </span>
                      {p.state === "APPROVED" && (
                        <a
                          href={`/faculty/permissions/${detail.id}/letter/${p.id}`}
                          style={{ display: "block", marginTop: 8, font: "600 12.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)", border: "1px solid var(--fac-border-focus)", borderRadius: 8, padding: "8px 12px", width: "fit-content" }}
                        >
                          Download permission letter
                        </a>
                      )}
                    </span>
                    <form action={async () => { await removeParticipantAction(detail.id, p.id); router.refresh(); }}>
                      <button type="submit" style={{ border: 0, background: "none", cursor: "pointer", color: "var(--fac-red-text)", font: "600 12px/1 var(--fac-font-sans)" }}>
                        Remove
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
