import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getMediaDashboard } from "@/lib/media-api";

export default async function MediaDashboardPage() {
  try {
    const summary = await getMediaDashboard();

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Media Room Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">Shoots, publishing and equipment, at a glance.</p>
        </div>

        <KpiGrid>
          <KpiCard eyebrow="Shoots today" value={String(summary.shootsToday)} />
          <KpiCard eyebrow="Scheduled posts" value={String(summary.scheduledPosts)} />
          <KpiCard eyebrow="Live posts" value={String(summary.livePosts)} />
          <KpiCard eyebrow="Pending indents" value={String(summary.pendingIndents)} />
        </KpiGrid>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text">Today's shoots</h2>
              <Link href="/media/shoot-assignments" className="text-xs font-bold text-primary hover:underline">All assignments</Link>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {summary.todaysShoots.length === 0 ? (
                <p className="text-sm text-text-muted">Nothing scheduled for today.</p>
              ) : (
                summary.todaysShoots.map((shoot) => (
                  <div key={shoot.id} className="flex items-center justify-between rounded-[var(--radius-input)] border border-border px-3.5 py-3">
                    <div>
                      <p className="text-sm font-bold text-text">{shoot.eventTitle}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {new Date(shoot.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        {shoot.crew.length > 0 ? ` · ${shoot.crew.map((c) => c.fullName).join(", ")}` : ""}
                      </p>
                    </div>
                    <StatusPill state={shoot.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text">Needs attention</h2>
              <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-text-muted">{summary.lowStockItems.length} flags</span>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {summary.lowStockItems.length === 0 ? (
                <p className="text-sm text-text-muted">No equipment running low.</p>
              ) : (
                summary.lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-bold text-text">{item.name}</p>
                      <p className="mt-0.5 text-xs text-text-muted">Low stock · {item.quantity} left (threshold {item.lowStockThreshold})</p>
                    </div>
                    <Link href="/media/inventory" className="text-xs font-bold text-primary hover:underline">View →</Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the Media Room dashboard. Nothing was submitted — try again." />;
  }
}
