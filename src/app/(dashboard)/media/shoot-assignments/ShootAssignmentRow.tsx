"use client";

import { useActionState, useState } from "react";
import { PrimaryButton, SecondaryButton, Select, StatusPill, TextInput, type PillTone } from "@/components/media-ui/primitives";
import type { MediaInventoryItem, MediaTeamMember, ShootAssignment, ShootStatus } from "@/lib/media-api";
import { deleteShootAssignmentAction, updateShootAssignmentAction, type FormState } from "./actions";

const initial: FormState = {};
const STATUS_TONE: Record<ShootStatus, PillTone> = { PLANNED: "gray", IN_PROGRESS: "blue", COMPLETED: "green", CANCELLED: "red" };

export function ShootAssignmentRow({ shoot, crew, gear, canModify }: { shoot: ShootAssignment; crew: MediaTeamMember[]; gear: MediaInventoryItem[]; canModify: boolean }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(updateShootAssignmentAction.bind(null, shoot.id), initial);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const scheduled = new Date(shoot.scheduledAt);
  const crewIds = new Set(shoot.crew.map((c) => c.id));
  const gearIds = new Set(shoot.gear.map((g) => g.id));

  async function handleDelete() {
    if (!confirm(`Delete the shoot assignment "${shoot.eventTitle}"?`)) return;
    setDeleting(true);
    setDeleteError(undefined);
    const result = await deleteShootAssignmentAction(shoot.id);
    setDeleting(false);
    if (result.error) setDeleteError(result.error);
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1fr 1fr 0.9fr 0.8fr 0.6fr", gap: 16, padding: "16px 26px", borderBottom: "1px solid var(--med-divider-2)", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--med-mono)", fontSize: 13.5, color: "var(--med-ink)" }}>{scheduled.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · {scheduled.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{shoot.eventTitle}</div>
          <div style={{ fontSize: 12.5, color: "var(--med-body-muted)", marginTop: 2 }}>{shoot.venue ?? "—"}</div>
        </div>
        <span style={{ fontSize: 14, color: "var(--med-ink)" }}>{shoot.crew.map((c) => c.fullName).join(", ") || "—"}</span>
        <span style={{ fontSize: 13.5, color: "var(--med-body)" }}>{shoot.gear.map((g) => g.name).join(", ") || "—"}</span>
        <span style={{ fontSize: 13.5, color: "var(--med-body)" }}>{shoot.outputType.replace("_", " + ")}</span>
        <StatusPill label={shoot.status.replace("_", " ")} tone={STATUS_TONE[shoot.status]} />
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="media-btn-hover-ghost"
            style={{ height: 36, padding: "0 14px", borderRadius: 8, border: "1px solid var(--med-border)", background: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", color: "var(--med-primary)", fontFamily: "inherit" }}
          >
            {editing ? "Close" : "Edit"}
          </button>
          {canModify && (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="media-btn-hover-ghost"
              style={{ height: 36, padding: "0 14px", borderRadius: 8, border: "1px solid var(--med-border)", background: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", color: "var(--med-red)", fontFamily: "inherit" }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
      {deleteError && <div style={{ padding: "0 26px 12px 26px", fontSize: 12.5, color: "var(--med-red)", fontWeight: 600 }}>{deleteError}</div>}

      {editing && (
        <div style={{ padding: "18px 26px 22px 26px", background: "#fff", borderBottom: "1px solid var(--med-divider-2)" }}>
          <form action={formAction}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr", gap: 14 }}>
              <TextInput type="date" name="scheduledDate" defaultValue={scheduled.toISOString().slice(0, 10)} style={{ height: 44, marginTop: 0 }} />
              <TextInput name="eventTitle" defaultValue={shoot.eventTitle} style={{ height: 44, marginTop: 0 }} />
              <TextInput type="time" name="scheduledTime" defaultValue={scheduled.toISOString().slice(11, 16)} style={{ height: 44, marginTop: 0 }} />
              <Select name="status" defaultValue={shoot.status} style={{ height: 44, marginTop: 0 }}>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              <TextInput name="venue" defaultValue={shoot.venue ?? ""} placeholder="Venue" style={{ height: 44, marginTop: 0 }} />
              <Select name="outputType" defaultValue={shoot.outputType} style={{ height: 44, marginTop: 0 }}>
                <option value="PHOTO">Photo</option>
                <option value="VIDEO">Video</option>
                <option value="PHOTO_VIDEO">Photo + Video</option>
              </Select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--med-primary)", marginBottom: 6 }}>Crew</div>
                <div style={{ maxHeight: 110, overflowY: "auto", border: "1px solid var(--med-input-border)", borderRadius: 10, padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                  {crew.map((m) => (
                    <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <input type="checkbox" name="crewIds" value={m.id} defaultChecked={crewIds.has(m.id)} />
                      {m.fullName}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--med-primary)", marginBottom: 6 }}>Gear</div>
                <div style={{ maxHeight: 110, overflowY: "auto", border: "1px solid var(--med-input-border)", borderRadius: 10, padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                  {gear.map((g) => (
                    <label key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <input type="checkbox" name="gearIds" value={g.id} defaultChecked={gearIds.has(g.id)} />
                      {g.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {state.error && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 12.5, fontWeight: 600 }}>{state.error}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
              <SecondaryButton type="button" onClick={() => setEditing(false)} style={{ height: 40, padding: "0 16px", fontSize: 13 }}>Cancel</SecondaryButton>
              <PrimaryButton type="submit" style={{ height: 40, padding: "0 18px", fontSize: 13 }}>Save changes</PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
