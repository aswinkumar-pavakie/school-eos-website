// Principal -> Announcements: full parity with Admin here, not view-only --
// the approved API doc names "Admin/leadership/authorized role" for creating
// an announcement specifically, so Principal sends announcements the same
// way Admin does (reusing CreateAnnouncementForm verbatim). Archive stays
// Admin-only: the doc's "leadership" callout is specific to the create line,
// not named for any other action. Real data from the same authoritative
// announcement + announcement_audience tables Admin's own page reads --
// nothing duplicated.

import { CreateAnnouncementForm } from "@/components/announcements/CreateAnnouncementForm";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";

interface Audience {
  audienceType: string;
  targetId: string | null;
  targetStage: string | null;
  targetRole: string | null;
}
interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  category: string | null;
  priority: string;
  isEmergency: boolean;
  createdAt: string;
  state: string;
  audiences: Audience[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PRINCIPAL: "Principal",
  VICE_PRINCIPAL: "Vice Principal",
  FACULTY: "Faculty",
  PARENT: "Parents",
  FINANCE: "Finance",
  ACADEMIC_COORDINATOR: "Academic Coordinators",
  CLASS_ADVISOR: "Class Advisors",
  SPORTS_FACULTY: "Sports Faculty",
  COMMUNITY_INCHARGE: "Community In-Charges",
  HEALTH_INCHARGE: "Health In-Charge",
  HOSTEL_WARDEN: "Hostel Wardens",
  BUS_ATTENDANT: "Bus Attendants",
  CANTEEN_VENDOR: "Canteen Vendors",
};

const ROLE_FILTER_OPTIONS = Object.entries(ROLE_LABELS);

function audienceLabel(audiences: Audience[]): string {
  if (audiences.some((a) => a.audienceType === "SCHOOL")) return "Everyone";
  return audiences
    .filter((a) => a.audienceType === "ROLE" && a.targetRole)
    .map((a) => ROLE_LABELS[a.targetRole!] ?? a.targetRole)
    .join(", ");
}

export default async function PrincipalAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ roleCode?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.roleCode) query.set("roleCode", params.roleCode);

  const res = await apiFetch(`/announcements?${query.toString()}`);

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load announcements</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: announcements } = (await res.json()) as { data: AnnouncementRow[] };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Notices</h1>
          <p className="mt-1 text-sm text-text-muted">Send a message to everyone, or to specific roles.</p>
        </div>
        <CreateAnnouncementForm revalidatePathOverride="/vice-principal/announcements" />
      </div>

      <form action="/vice-principal/announcements" className="mt-6 flex items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Filter by role</span>
          <AutoSubmitSelect
            name="roleCode"
            defaultValue={params.roleCode ?? ""}
            className="min-w-[200px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">All (everyone + every role)</option>
            {ROLE_FILTER_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
      </form>

      <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">
        All announcements · {announcements.length}
      </p>
      <ul className="mt-2.5 flex flex-col gap-3">
        {announcements.length === 0 && (
          <li className="rounded-[16px] border border-dashed border-border bg-surface p-8 text-center text-sm text-text-muted">
            No notices yet.
          </li>
        )}
        {announcements.map((a) => (
          <li
            key={a.id}
            className="card-hover rounded-[16px] border border-border bg-surface p-[18px]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-[var(--radius-pill)] bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  {a.category ?? "General"}
                </span>
                <StatusPill tone={a.state === "PUBLISHED" ? "success" : "pending"} label={a.state.replace(/_/g, " ")} />
                {a.isEmergency && <StatusPill tone="critical" label="Emergency" />}
                {a.priority === "URGENT" && !a.isEmergency && <StatusPill tone="pending" label="Urgent" />}
              </div>
              <span className="text-xs text-text-muted">{formatRelativeTime(a.createdAt)}</span>
            </div>
            <p className="mt-2.5 text-[15px] font-extrabold leading-[20px] text-text">{a.title}</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-text-muted">{a.body}</p>
            <p className="mt-2.5 text-xs font-semibold text-primary">{audienceLabel(a.audiences)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
