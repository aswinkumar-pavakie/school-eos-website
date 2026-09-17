import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill, toneOf } from "@/components/sports-ui/primitives";
import { orDash, statusLabel } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listCoaches } from "@/lib/sports-admin-api";
import { AddCoachPanel } from "./AddCoachPanel";

export default async function SportsAdminCoachesPage() {
  try {
    const coaches = await listCoaches();

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Coaches &amp; PT staff</div>
            <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>{coaches.length} on the roster</div>
          </div>
          <AddCoachPanel />
        </div>

        {coaches.length === 0 ? (
          <div style={{ marginTop: 20 }}><EmptyPanel label="No coaches added yet." /></div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, marginTop: 22, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr 0.8fr", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--sport-divider)" }}>
              {["NAME", "QUALIFICATION", "PHONE", "TYPE", "STATUS"].map((h) => (
                <span key={h} style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-tertiary)" }}>{h}</span>
              ))}
            </div>
            {coaches.map((c, i) => (
              <div key={c.id} className="sport-row-hover" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr 0.8fr", gap: 14, padding: "14px 20px", borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined, alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{c.fullName}</span>
                <span style={{ fontSize: 13.5, color: "var(--sport-body)" }}>{orDash(c.qualification)}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-body)" }}>{orDash(c.contactPhone)}</span>
                <span style={{ fontSize: 13.5, color: "var(--sport-body)" }}>{c.isExternal ? "External" : "In-house"}</span>
                <StatusPill label={statusLabel(c.status)} tone={toneOf(c.status)} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load coaches."} />;
  }
}
