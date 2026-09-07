// Principal's read-only mirror of ActivitiesSection -- same activity list, no
// "+ New activity" control.

import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate } from "@/lib/format";

interface ActivityRow {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  venue: string | null;
  status: string;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "critical";
  return "pending";
}

export function PrincipalActivitiesSection({ activities }: { activities: ActivityRow[] }) {
  return (
    <div className="rounded-[16px] border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Activities</h2>
        <span className="text-xs text-text-muted">{activities.length} activities</span>
      </div>

      {activities.length === 0 && (
        <p className="mt-3 rounded-[11px] border border-dashed border-border bg-field px-3.5 py-3 text-sm text-text-muted">
          No activities scheduled yet.
        </p>
      )}

      <ul className="mt-3 flex flex-col divide-y divide-border">
        {activities.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="text-[13.5px] font-semibold text-text">{a.title}</p>
              <p className="text-xs text-text-muted">
                {formatDate(a.scheduledAt)}
                {a.venue && ` · ${a.venue}`}
              </p>
              {a.description && <p className="mt-0.5 text-xs text-text-muted">{a.description}</p>}
            </div>
            <StatusPill tone={statusTone(a.status)} label={a.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
