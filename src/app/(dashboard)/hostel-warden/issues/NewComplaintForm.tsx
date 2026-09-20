"use client";

import { useState, useTransition } from "react";
import { Card, FieldLabel, GhostButton, PrimaryButton, TextArea, TextInput } from "@/components/hostel-warden-ui/primitives";
import { useFlash } from "@/components/hostel-warden-ui/FlashContext";
import type { HostelStructureBlock } from "@/lib/hostel-warden-api";
import { HOSTEL_ISSUE_TYPES, HOSTEL_ISSUE_TYPE_LABELS, type HostelIssueType } from "@/lib/hostel-warden-constants";
import { createComplaintAction } from "./actions";

// Inline, matching the design's own "New issue entry" panel -- not a modal.
// The design's own mock also pictures Reference/Told to warden by/Assigned
// to/Priority/Age fields, but complaint.category is hardcoded 'HOSTEL'
// server-side (there is no real Mess/Amenities complaint category, and no
// priority/assignee/reference columns at all -- confirmed by the DTO's own
// header comment) -- those are left out rather than fabricated; the real
// fields (subject/description/type/block/room) are all here.
export function NewComplaintForm({ blocks }: { blocks: HostelStructureBlock[] }) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<HostelIssueType>("ELECTRICAL");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [blockId, setBlockId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const { showFlash } = useFlash();

  const rooms = blocks.find((b) => b.id === blockId)?.rooms ?? [];

  function close() {
    setOpen(false);
    setSubject("");
    setDescription("");
    setBlockId("");
    setRoomId("");
    setError(undefined);
  }

  function submit() {
    if (subject.trim() === "" || description.trim() === "") {
      setError("Subject and description are both required.");
      return;
    }
    startTransition(async () => {
      setError(undefined);
      try {
        await createComplaintAction({ issueType, subject: subject.trim(), description: description.trim(), blockId: blockId || undefined, roomId: roomId || undefined });
        showFlash("Issue logged.");
        close();
      } catch (err) {
        setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <PrimaryButton type="button" style={{ height: 36 }} onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "+ Log an issue"}
        </PrimaryButton>
      </div>
      {open && (
        <Card style={{ padding: "18px 20px" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>New issue entry</h3>
          <p style={{ margin: "4px 0 16px", fontSize: 12.5, color: "var(--hw-text-muted)" }}>
            Every field here is entered by the warden — students and parents have no login.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
            <FieldLabel style={{ gridColumn: "span 2" }}>
              Issue
              <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Water heater dead in A-wing bathroom" />
            </FieldLabel>
            <FieldLabel>
              Category
              <select className="input" value={issueType} onChange={(e) => setIssueType(e.target.value as HostelIssueType)} style={{ height: 34 }}>
                {HOSTEL_ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {HOSTEL_ISSUE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel>
              Block
              <select className="input" value={blockId} onChange={(e) => { setBlockId(e.target.value); setRoomId(""); }} style={{ height: 34 }}>
                <option value="">Not specified</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel style={{ gridColumn: "span 3" }}>
              Description
              <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you see or hear from the student?" />
            </FieldLabel>
            <FieldLabel>
              Room
              <select className="input" value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!blockId} style={{ height: 34 }}>
                <option value="">Not specified</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNo}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>
          {error && (
            <p role="alert" style={{ margin: "14px 0 0", padding: "10px 14px", borderRadius: 9, background: "var(--hw-red-bg)", color: "var(--hw-red-text)", fontSize: 13, fontWeight: 600 }}>
              {error}
            </p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <PrimaryButton type="button" onClick={submit} disabled={pending} style={{ height: 34, padding: "0 18px", fontSize: 13 }}>
              {pending ? "Saving…" : "Save record"}
            </PrimaryButton>
            <GhostButton type="button" onClick={close} disabled={pending} style={{ height: 34, fontSize: 13 }}>
              Cancel
            </GhostButton>
          </div>
        </Card>
      )}
    </div>
  );
}
