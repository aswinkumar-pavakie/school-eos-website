// Notifications -- the first web consumer of a real backend module
// (notifications.controller.ts) that already exists with real data (this
// session confirmed 230 real rows, written by OutboxService across
// approvals/attendance-alerts/hostel-call-requests). Never role-gated on the
// backend -- notifications are inherently personal (notification.person_id),
// scoped server-side to the authenticated actor's own personId. Real
// unread-count badge surfaces in the sidebar (see layout.tsx).

import { redirect } from "next/navigation";
import { NotificationRow } from "@/components/notifications/NotificationRow";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { AuthExpiredError } from "@/lib/api";
import { listNotifications } from "@/lib/notifications-api";

export default async function CorrespondentNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const unreadOnly = filter === "unread";

  let notifications: Awaited<ReturnType<typeof listNotifications>>;
  try {
    notifications = await listNotifications({ unreadOnly, limit: 50 });
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load notifications</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Notifications</h1>
          <p className="mt-1 text-sm text-text-muted">
            {notifications.unreadCount > 0 ? `${notifications.unreadCount} unread` : "You're all caught up."}
          </p>
        </div>
      </div>

      <form action="/correspondent/notifications" className="mt-6 flex items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Filter</span>
          <AutoSubmitSelect
            name="filter"
            defaultValue={filter ?? ""}
            className="min-w-[180px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">All</option>
            <option value="unread">Unread only</option>
          </AutoSubmitSelect>
        </label>
      </form>

      {notifications.data.length === 0 ? (
        <div className="mt-6 rounded-[16px] border border-dashed border-border bg-surface p-8 text-center text-sm text-text-muted">
          {unreadOnly ? "No unread notifications." : "No notifications yet."}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2.5">
          {notifications.data.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
