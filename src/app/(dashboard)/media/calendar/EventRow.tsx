"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton, TextInput } from "@/components/media-ui/primitives";
import type { CalendarEvent } from "@/lib/media-api";
import { deleteMediaEventAction, updateMediaEventAction } from "./actions";

export function EventRow({ event, canModify }: { event: CalendarEvent; canModify: boolean }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.startDate.slice(0, 10));
  const [description, setDescription] = useState(event.description ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const s = new Date(event.startDate);

  async function handleSave() {
    setPending(true);
    setError(undefined);
    const result = await updateMediaEventAction(event.id, { title, date, description });
    setPending(false);
    if (result.error) setError(result.error);
    else setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${event.title}" from the calendar?`)) return;
    setPending(true);
    const result = await deleteMediaEventAction(event.id);
    setPending(false);
    if (result.error) setError(result.error);
  }

  if (editing) {
    return (
      <div style={{ padding: "16px 0", borderBottom: "1px solid var(--med-divider)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" style={{ marginTop: 0 }} />
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ marginTop: 0 }} />
        </div>
        <TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={{ marginTop: 10 }} />
        {error && <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 12.5, fontWeight: 600 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setEditing(false)} style={{ height: 36, padding: "0 14px", fontSize: 12.5 }}>Cancel</SecondaryButton>
          <PrimaryButton type="button" disabled={pending} onClick={handleSave} style={{ height: 36, padding: "0 16px", fontSize: 12.5 }}>Save</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderBottom: "1px solid var(--med-divider)" }}>
      <div style={{ width: 58, flex: "none", textAlign: "center", background: "#fff", border: "1px solid var(--med-border)", borderRadius: 10, padding: "8px 0" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: "var(--med-navy)", lineHeight: 1 }}>{s.getDate()}</div>
        <div style={{ fontSize: 10.5, color: "var(--med-tertiary)", letterSpacing: "0.8px", marginTop: 3 }}>{s.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase()}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{event.title}</div>
        <div style={{ fontSize: 13, color: "var(--med-body-muted)", marginTop: 3 }}>{event.description ?? ""}</div>
        {error && <div style={{ marginTop: 6, fontSize: 12, color: "var(--med-red)", fontWeight: 600 }}>{error}</div>}
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, background: "var(--med-panel)", color: "var(--med-body)", borderRadius: 20, padding: "5px 12px", whiteSpace: "nowrap" }}>
        {event.isHoliday ? "Holiday" : "Event"}
      </span>
      {canModify && (
        <div style={{ display: "flex", gap: 6, flex: "none" }}>
          <button type="button" onClick={() => setEditing(true)} style={{ height: 30, padding: "0 10px", borderRadius: 7, border: "1px solid var(--med-border)", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--med-primary)", fontFamily: "inherit" }}>Edit</button>
          <button type="button" disabled={pending} onClick={handleDelete} style={{ height: 30, padding: "0 10px", borderRadius: 7, border: "1px solid var(--med-border)", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--med-red)", fontFamily: "inherit" }}>Delete</button>
        </div>
      )}
    </div>
  );
}
