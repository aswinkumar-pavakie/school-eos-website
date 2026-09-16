"use client";

import { useState, useTransition } from "react";
import { HostelWardenModal } from "@/components/hostel-warden-ui/Modal";
import { FieldLabel, GhostButton, PrimaryButton, TextArea, TextInput } from "@/components/hostel-warden-ui/primitives";
import { useFlash } from "@/components/hostel-warden-ui/FlashContext";
import type { HostelStructureBlock } from "@/lib/hostel-warden-api";
import { HOSTEL_ISSUE_TYPES, HOSTEL_ISSUE_TYPE_LABELS, type HostelIssueType } from "@/lib/hostel-warden-constants";
import { createComplaintAction } from "./actions";

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
    <>
      <PrimaryButton type="button" style={{ height: 36 }} onClick={() => setOpen(true)}>
        + Log an issue
      </PrimaryButton>
      <HostelWardenModal open={open} onClose={close} title="Log an issue" width={560}>
        <div style={{ padding: "16px 22px 4px", display: "flex", flexDirection: "column", gap: 12 }}>
          <FieldLabel>
            Type
            <select className="input" value={issueType} onChange={(e) => setIssueType(e.target.value as HostelIssueType)} style={{ height: 34 }}>
              {HOSTEL_ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {HOSTEL_ISSUE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel>
            Subject
            <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Water heater dead in A-wing bathroom" />
          </FieldLabel>
          <FieldLabel>
            Description
            <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you see or hear from the student?" />
          </FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldLabel>
              Block (optional)
              <select className="input" value={blockId} onChange={(e) => { setBlockId(e.target.value); setRoomId(""); }} style={{ height: 34 }}>
                <option value="">Not specified</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel>
              Room (optional)
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
        </div>
        {error && (
          <p role="alert" style={{ margin: "10px 22px 0", padding: "10px 14px", borderRadius: 9, background: "var(--hw-red-bg)", color: "var(--hw-red-text)", fontSize: 13, fontWeight: 600 }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "18px 22px 22px" }}>
          <GhostButton type="button" onClick={close} disabled={pending} style={{ height: 32, fontSize: 12.5 }}>
            Cancel
          </GhostButton>
          <PrimaryButton type="button" onClick={submit} disabled={pending} style={{ height: 32, fontSize: 12.5 }}>
            {pending ? "Logging…" : "Log issue"}
          </PrimaryButton>
        </div>
      </HostelWardenModal>
    </>
  );
}
