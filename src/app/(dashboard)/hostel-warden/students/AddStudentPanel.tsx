"use client";

import { useState } from "react";
import { Card, FieldLabel, GhostButton, PrimaryButton, TextInput } from "@/components/hostel-warden-ui/primitives";

// The design's own "New student record" form pictures the Warden creating a
// full student record directly, with no student/parent login at all. The
// real system is a different, larger domain: student records are created by
// Admin during admission (aadhaar, DOB, section placement, fee assignment --
// see room-bed-view.service.ts's own "Feature 8 -- READ ONLY" header comment,
// confirmed live: hostel/block/room/bed/allocation CRUD is Admin-only
// everywhere in this codebase). Building a Warden-side student-creation
// write here would be a real, undisclosed security boundary change, not a
// UI gap -- so the form is built pixel-for-pixel, but Save gives the real
// answer instead of a fabricated success.
export function AddStudentPanel() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [room, setRoom] = useState("");
  const [sharing, setSharing] = useState("");
  const [guardian, setGuardian] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [secondContact, setSecondContact] = useState("");
  const [fees, setFees] = useState("");
  const [notice, setNotice] = useState<string | undefined>();

  function close() {
    setOpen(false);
    setNotice(undefined);
  }

  function submit() {
    setNotice(
      "Student records are created by Admin during admission, not by the Warden — this keeps admission, ID and fee-assignment data consistent across the school. Ask your school Admin to add this resident, then allot them a room from the Admin console.",
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <PrimaryButton type="button" style={{ height: 36 }} onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "+ Add student"}
        </PrimaryButton>
      </div>
      {open && (
        <Card style={{ padding: "18px 20px" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>New student record</h3>
          <p style={{ margin: "4px 0 16px", fontSize: 12.5, color: "var(--hw-text-muted)" }}>
            Every field here is entered by the warden — students and parents have no login.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 14 }}>
            <FieldLabel>
              Student name
              <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Menon" />
            </FieldLabel>
            <FieldLabel>
              Admission no.
              <TextInput value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} placeholder="ADM-8114" />
            </FieldLabel>
            <FieldLabel>
              Class
              <TextInput value={cls} onChange={(e) => setCls(e.target.value)} placeholder="Class 8" />
            </FieldLabel>
            <FieldLabel>
              Section
              <TextInput value={section} onChange={(e) => setSection(e.target.value)} placeholder="Section A" />
            </FieldLabel>
            <FieldLabel>
              Room
              <TextInput value={room} onChange={(e) => setRoom(e.target.value)} placeholder="A-212" />
            </FieldLabel>
            <FieldLabel>
              Sharing
              <TextInput value={sharing} onChange={(e) => setSharing(e.target.value)} placeholder="Triple" />
            </FieldLabel>
            <FieldLabel>
              Guardian
              <TextInput value={guardian} onChange={(e) => setGuardian(e.target.value)} placeholder="S. Menon (father)" />
            </FieldLabel>
            <FieldLabel>
              Guardian phone
              <TextInput value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="98450 22104" />
            </FieldLabel>
            <FieldLabel>
              Second contact
              <TextInput value={secondContact} onChange={(e) => setSecondContact(e.target.value)} placeholder="98450 22110" />
            </FieldLabel>
            <FieldLabel>
              Fees
              <TextInput value={fees} onChange={(e) => setFees(e.target.value)} placeholder="Paid / Due ₹18,000" />
            </FieldLabel>
          </div>
          {notice && (
            <p role="status" style={{ margin: "14px 0 0", padding: "10px 14px", borderRadius: 9, background: "var(--hw-amber-bg)", color: "var(--hw-amber-text)", fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
              {notice}
            </p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <PrimaryButton type="button" onClick={submit} style={{ height: 34, padding: "0 18px", fontSize: 13 }}>
              Save record
            </PrimaryButton>
            <GhostButton type="button" onClick={close} style={{ height: 34, fontSize: 13 }}>
              Cancel
            </GhostButton>
          </div>
        </Card>
      )}
    </div>
  );
}
