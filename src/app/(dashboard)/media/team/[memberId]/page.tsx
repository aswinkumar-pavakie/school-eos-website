// Media Team member detail -- pixel-rebuilt from the design's own
// isTeamDetail screen. Real data throughout (getMediaTeamMember): active/
// completed job counts (real shoot_assignment_crew counts), equipment
// currently held (real inventory_item.assignedToPersonId cross-reference),
// recent activity (real audit_event rows for this person). The design's own
// "Basic Details" panel shows many HR fields (staff id, qualification,
// specialization, DOJ, address, reporting officer, employment type,
// previous/total experience) that media_team_member genuinely has no
// columns for -- media_team_member is a lightweight roster (see its own
// repository header comment: "not person + role_assignment"), not a staff
// HR record. Those fields are honestly omitted rather than invented; only
// the real columns (name, designation, email, phone, skills, status) are
// shown. "Avg. turnaround" is the same kind of gap (no per-shoot completion
// timestamp exists) and is omitted for the same reason.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill } from "@/components/media-ui/primitives";
import { formatDate } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getMediaTeamMember } from "@/lib/media-api";
import { EditMemberPanel } from "./EditMemberPanel";

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export default async function MediaTeamMemberPage({ params }: { params: Promise<{ memberId: string }> }) {
  try {
    const { memberId } = await params;
    const member = await getMediaTeamMember(memberId);

    return (
      <div className="media-scope">
        <Link href="/media/team" style={{ fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
          ‹ Back to Media Team
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 20, background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "26px 28px", flexWrap: "wrap" }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--med-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24, flexShrink: 0 }}>{initialsOf(member.fullName)}</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px" }}>{member.fullName}</div>
            <div style={{ fontSize: 15, color: "var(--med-body-muted)", marginTop: 4 }}>{member.designation ?? "—"} · Media Room</div>
            <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 13.5, color: "var(--med-body)", flexWrap: "wrap" }}>
              <span>{member.email ?? "No email on file"}</span>
              <span>·</span>
              <span>{member.phone ?? "No phone on file"}</span>
            </div>
          </div>
          <StatusPill label={member.status} tone={member.status === "ACTIVE" ? "green" : "gray"} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 20, marginTop: 20 }}>
          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "22px 24px" }}>
            <div style={{ fontSize: 14.5, color: "var(--med-body)", fontWeight: 600 }}>Active jobs</div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1.2px", marginTop: 10 }}>{member.active}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "22px 24px" }}>
            <div style={{ fontSize: 14.5, color: "var(--med-body)", fontWeight: 600 }}>Completed this term</div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1.2px", marginTop: 10 }}>{member.completed}</div>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px", marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>Contact &amp; role</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "20px 28px", marginTop: 18 }}>
            <div><div style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary-2)" }}>FULL NAME</div><div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 6 }}>{member.fullName}</div></div>
            <div><div style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary-2)" }}>DESIGNATION</div><div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 6 }}>{member.designation ?? "—"}</div></div>
            <div><div style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary-2)" }}>DEPARTMENT</div><div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 6 }}>Media Room</div></div>
            <div><div style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary-2)" }}>EMAIL</div><div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 6 }}>{member.email ?? "—"}</div></div>
            <div><div style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary-2)" }}>MOBILE NUMBER</div><div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 6 }}>{member.phone ?? "—"}</div></div>
            <div><div style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary-2)" }}>SKILLS</div><div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 6 }}>{member.skills.length > 0 ? member.skills.join(", ") : "—"}</div></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <EditMemberPanel member={member} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20, marginTop: 20, alignItems: "start" }}>
          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>Equipment currently held</div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
              {member.equipment.length === 0 ? (
                <div style={{ fontSize: 13.5, color: "var(--med-tertiary)", padding: "13px 0" }}>Nothing checked out right now.</div>
              ) : (
                member.equipment.map((eq, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--med-divider)" }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600 }}>{eq}</span>
                    <StatusPill label="Issued" tone="blue" />
                  </div>
                ))
              )}
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>Recent activity</div>
            {member.activity.length === 0 ? (
              <div style={{ marginTop: 12 }}><EmptyPanel label="No recorded activity for this account yet." /></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
                {member.activity.map((act) => (
                  <div key={act.id} style={{ display: "flex", gap: 14, padding: "13px 0", borderBottom: "1px solid var(--med-divider)" }}>
                    <span style={{ fontFamily: "var(--med-mono)", fontSize: 12.5, color: "var(--med-tertiary)", width: 86, flexShrink: 0 }}>{formatDate(act.date)}</span>
                    <span style={{ fontSize: 13.5, flex: 1 }}>{act.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this team member."} />;
  }
}
