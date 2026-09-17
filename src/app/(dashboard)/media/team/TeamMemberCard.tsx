"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusPill } from "@/components/media-ui/primitives";
import type { MediaTeamMember } from "@/lib/media-api";
import { setMediaTeamMemberStatusAction } from "./actions";

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

// A plain <div> rather than nesting the Edit/Delete buttons inside a Next
// <Link> (invalid HTML: a <button> may not be a descendant of an <a>) --
// clicking the card body still navigates to the real edit-capable detail
// page; the two explicit controls here are their own click targets.
export function TeamMemberCard({ member, maxJobs }: { member: MediaTeamMember; maxJobs: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleToggleStatus(e: React.MouseEvent) {
    e.stopPropagation();
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (nextStatus === "INACTIVE" && !confirm(`Remove "${member.fullName}" from the active media team? This can be undone later.`)) return;
    setPending(true);
    setError(undefined);
    const result = await setMediaTeamMemberStatusAction(member.id, nextStatus);
    setPending(false);
    if (result.error) setError(result.error);
  }

  return (
    <div
      className="media-card-hover"
      onClick={() => router.push(`/media/team/${member.id}`)}
      style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "22px 24px", cursor: "pointer" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--med-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{initialsOf(member.fullName)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{member.fullName}</div>
          <div style={{ fontSize: 13, color: "var(--med-body-muted)", marginTop: 2 }}>{member.designation ?? "—"}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "var(--med-body-muted)", marginTop: 18 }}>
        <span>Active jobs</span>
        <b style={{ color: "var(--med-ink)" }}>{member.activeJobs}</b>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: "var(--med-panel)", marginTop: 10, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, (member.activeJobs / maxJobs) * 100)}%`, height: "100%", background: "var(--med-primary)" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <StatusPill label={member.status} tone={member.status === "ACTIVE" ? "green" : "gray"} />
        <span style={{ fontSize: 12.5, color: "var(--med-tertiary)" }}>{member.phone ?? "—"}</span>
      </div>
      {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--med-red)", fontWeight: 600 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); router.push(`/media/team/${member.id}`); }}
          style={{ flex: 1, height: 34, borderRadius: 8, border: "1px solid #d9dee7", background: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", color: "var(--med-primary)", fontFamily: "inherit" }}
        >
          Edit
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleToggleStatus}
          style={{ flex: 1, height: 34, borderRadius: 8, border: "1px solid #d9dee7", background: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", color: member.status === "ACTIVE" ? "var(--med-red)" : "var(--med-green)", fontFamily: "inherit" }}
        >
          {member.status === "ACTIVE" ? "Delete" : "Restore"}
        </button>
      </div>
    </div>
  );
}
