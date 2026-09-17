import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/sports-ui/primitives";
import { formatDate } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listCalendarEvents } from "@/lib/sports-admin-api";
import { AddEventPanel } from "./AddEventPanel";

export default async function SportsAdminCalendarPage() {
  try {
    const events = await listCalendarEvents();
    const sorted = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const now = Date.now();
    const upcoming = sorted.filter((e) => new Date(e.endDate).getTime() >= now);
    const past = sorted.filter((e) => new Date(e.endDate).getTime() < now).reverse();

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>School calendar</div>
            <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>{events.length} events on the school-wide calendar</div>
          </div>
          <AddEventPanel />
        </div>

        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--sport-heading)", marginTop: 26, marginBottom: 12 }}>Upcoming</div>
        {upcoming.length === 0 ? (
          <EmptyPanel label="No upcoming events." />
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, overflow: "hidden" }}>
            {upcoming.map((e, i) => <EventRow key={e.id} event={e} bordered={i > 0} />)}
          </div>
        )}

        {past.length > 0 && (
          <>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--sport-heading)", marginTop: 26, marginBottom: 12 }}>Past</div>
            <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, overflow: "hidden", opacity: 0.7 }}>
              {past.slice(0, 20).map((e, i) => <EventRow key={e.id} event={e} bordered={i > 0} />)}
            </div>
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the calendar."} />;
  }
}

function EventRow({ event, bordered }: { event: { id: string; title: string; description: string | null; startDate: string; endDate: string; eventType: string }; bordered: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: bordered ? "1px solid var(--sport-divider)" : undefined }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{event.title}</div>
        <div style={{ fontSize: 12.5, color: "var(--sport-tertiary)", marginTop: 2 }}>{event.description ?? event.eventType}</div>
      </div>
      <div style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-body)" }}>
        {formatDate(event.startDate)}{event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ""}
      </div>
    </div>
  );
}
