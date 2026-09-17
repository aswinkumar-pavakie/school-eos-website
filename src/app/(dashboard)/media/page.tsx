// Media Room Dashboard -- pixel-rebuilt from the design's own isDashboard
// screen. Real data throughout: getMediaDashboard (today's shoots, posts by
// state, pending indents, low-stock flags), listShootAssignments (real
// upcoming-shoot list/count, not just today's), getMediaInventoryOverview
// (real issued/total). The design's own greeting uses the logged-in email,
// same as every other rebuilt module's Home screen.

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { StatusPill, type PillTone } from "@/components/media-ui/primitives";
import { ACCESS_TOKEN_COOKIE, AuthExpiredError } from "@/lib/api";
import { getMediaDashboard, getMediaInventoryOverview, listShootAssignments, type ShootStatus } from "@/lib/media-api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

interface MeResponse {
  data: { person: { firstName: string; lastName: string | null } };
}

const SHOOT_TONE: Record<ShootStatus, PillTone> = {
  PLANNED: "gray",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function MediaDashboardPage() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? "";
    const meRes = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
    const firstName = me?.data.person.firstName ?? "";

    const [dashboard, inventoryOverview, allShoots] = await Promise.all([
      getMediaDashboard(),
      getMediaInventoryOverview(),
      listShootAssignments(),
    ]);

    const now = new Date();
    const upcoming = allShoots
      .filter((s) => (s.status === "PLANNED" || s.status === "IN_PROGRESS") && new Date(s.scheduledAt) >= new Date(now.toDateString()))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    const queueTotal = dashboard.scheduledPosts + dashboard.draftPosts;

    const flags = dashboard.lowStockItems.map((i) => ({
      title: `${i.name} running low`,
      sub: `${i.quantity} left · threshold ${i.lowStockThreshold}`,
    }));
    if (dashboard.pendingIndents > 0) {
      flags.push({ title: `${dashboard.pendingIndents} indent${dashboard.pendingIndents === 1 ? "" : "s"} awaiting approval`, sub: "Raise indent" });
    }

    return (
      <div className="media-scope">
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.1, overflowWrap: "break-word" }}>
          {greeting()}{firstName ? `, ${firstName}` : ""}
        </div>
        <div style={{ fontSize: 15.5, color: "var(--med-body-muted)", marginTop: 10 }}>
          {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · Media room
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 20, marginTop: 24 }}>
          <Link href="/media/shoot-assignments" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="media-card-hover" style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "22px 24px", cursor: "pointer" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--med-body)" }}>Shoot assignments</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-1.4px", marginTop: 14 }}>{upcoming.length}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 10, color: "var(--med-primary)" }}>View assignments</div>
            </div>
          </Link>
          <Link href="/media/social-publishing" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="media-card-hover" style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "22px 24px", cursor: "pointer" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--med-body)" }}>Posts in queue</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-1.4px", marginTop: 14 }}>{queueTotal}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 10, color: "var(--med-primary)" }}>Open publishing</div>
            </div>
          </Link>
          <Link href="/media/inventory" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="media-card-hover" style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "22px 24px", cursor: "pointer" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--med-body)" }}>Equipment issued</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-1.4px", marginTop: 14 }}>
                {inventoryOverview.assigned} <span style={{ fontSize: 20, color: "var(--med-tertiary)", fontWeight: 700 }}>/ {inventoryOverview.total}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 10, color: "var(--med-primary)" }}>View inventory</div>
            </div>
          </Link>
          <Link href="/media/raise-indent" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="media-card-hover" style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "22px 24px", cursor: "pointer" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--med-body)" }}>Pending indents</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-1.4px", marginTop: 14 }}>{dashboard.pendingIndents}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 10, color: "var(--med-primary)" }}>Review indents</div>
            </div>
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 20, marginTop: 20 }}>
          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>Upcoming shoots</div>
              <Link href="/media/shoot-assignments" style={{ fontSize: 14, fontWeight: 700 }}>All assignments</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
              {upcoming.length === 0 && <div style={{ fontSize: 13.5, color: "var(--med-tertiary)" }}>Nothing scheduled.</div>}
              {upcoming.slice(0, 5).map((a) => (
                <div key={a.id} className="media-row-hover" style={{ display: "flex", alignItems: "center", gap: 16, border: "1px solid var(--med-row-border)", borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ width: 100, flex: "none", textAlign: "center", background: "#fff", border: "1px solid var(--med-border)", borderRadius: 10, padding: "8px 4px" }}>
                    <div style={{ fontFamily: "var(--med-mono)", fontSize: 12.5, fontWeight: 600, color: "var(--med-navy)" }}>
                      {new Date(a.scheduledAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · {new Date(a.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 700 }}>{a.eventTitle}</div>
                    <div style={{ fontSize: 13, color: "var(--med-body-muted)", marginTop: 3 }}>
                      {a.crew.length > 0 ? a.crew.map((c) => c.fullName).join(", ") : "No crew assigned"} · {a.outputType.replace("_", " + ")}
                    </div>
                  </div>
                  <StatusPill label={a.status.replace("_", " ")} tone={SHOOT_TONE[a.status]} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>Needs attention</div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--med-primary)", background: "var(--med-tint)", borderRadius: 20, padding: "5px 12px" }}>{flags.length} flags</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
              {flags.length === 0 && <div style={{ fontSize: 13.5, color: "var(--med-tertiary)", padding: "14px 0" }}>Nothing needs attention right now.</div>}
              {flags.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--med-divider)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 7, flexShrink: 0, background: "var(--med-primary)" }} />
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: "var(--med-body-muted)", marginTop: 2 }}>{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the Media Room dashboard."} />;
  }
}
