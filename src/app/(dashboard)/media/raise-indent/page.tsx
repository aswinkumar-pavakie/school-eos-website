// Raise indent -- pixel-rebuilt from the design's own isIndent screen. Real
// purchase_request data (listMediaIndents/createMediaIndent), routed
// Media Room Head -> Principal directly (see database/migrations/
// 0006_media_room.sql's MEDIA_INDENT approval_policy: a single PRINCIPAL
// step, not the design's own "-> Administrative Officer ->" copy -- the real,
// already-configured policy has no AO step, so the route text below shows
// the real chain, not the mockup's assumed one).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/media-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { listMediaIndents } from "@/lib/media-api";
import { RaiseIndentForm } from "./RaiseIndentForm";
import { IndentRow } from "./IndentRow";

export default async function RaiseIndentPage({ searchParams }: { searchParams: Promise<{ history?: string }> }) {
  const { history } = await searchParams;
  const showHistory = history === "1";

  try {
    const indents = await listMediaIndents();

    return (
      <div className="media-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.1 }}>Raise indent</div>
            <div style={{ fontSize: 15.5, color: "var(--med-body-muted)", marginTop: 10 }}>Equipment and consumable indents raised to the management · approval goes to the Principal</div>
          </div>
          <a href={`/media/raise-indent${showHistory ? "" : "?history=1"}`} style={{ textDecoration: "none" }}>
            <span
              className={showHistory ? undefined : "media-btn-hover-ghost"}
              style={{ display: "inline-block", height: 52, lineHeight: "52px", padding: "0 22px", borderRadius: 12, border: showHistory ? "1px solid var(--med-navy)" : "1px solid #d9dee7", background: showHistory ? "var(--med-navy)" : "#fff", color: showHistory ? "#fff" : "var(--med-ink)", fontSize: 14.5, fontWeight: 700, whiteSpace: "nowrap" }}
            >
              {showHistory ? "Hide history" : `History (${indents.length})`}
            </span>
          </a>
        </div>

        <RaiseIndentForm />

        {showHistory && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginTop: 32 }}>Indent history</div>
            {indents.length === 0 ? (
              <div style={{ marginTop: 16 }}><EmptyPanel label="Submit one above to send it to the Principal for a decision." /></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                {indents.map((n) => (
                  <IndentRow key={n.id} indent={n} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load indents."} />;
  }
}
