// Announcements -- real data from the pre-existing announcement +
// announcement_audience tables (see query.md for how a first draft nearly
// duplicated this into a simpler, wrong-shaped table before catching it).

import { CreateAnnouncementForm } from "@/components/announcements/CreateAnnouncementForm";
import { ArchiveAnnouncementButton } from "@/components/announcements/ArchiveAnnouncementButton";
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

export default async function AnnouncementsPage({
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
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Announcements</h1>
          <p className="mt-1 text-sm text-text-muted">Send a message to everyone, or to specific roles.</p>
        </div>
        <CreateAnnouncementForm />
      </div>

      <form action="/admin/announcements" className="mt-6 flex items-end gap-3">
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

      <ul className="mt-6 flex flex-col gap-3">
        {announcements.length === 0 && (
          <li className="rounded-[16px] border border-dashed border-border bg-surface p-8 text-center text-sm text-text-muted">
            No announcements yet.
          </li>
        )}
        {announcements.map((a) => (
          <li key={a.id} className="rounded-[16px] border border-border bg-surface p-[18px]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-extrabold leading-[20px] text-text">{a.title}</p>
                  {a.isEmergency && <StatusPill tone="critical" label="Emergency" />}
                  {a.priority === "URGENT" && !a.isEmergency && <StatusPill tone="pending" label="Urgent" />}
                </div>
                <p className="mt-1 text-xs font-semibold text-primary">
                  {audienceLabel(a.audiences)}
                  {a.category ? ` · ${a.category}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">{formatRelativeTime(a.createdAt)}</span>
                <ArchiveAnnouncementButton id={a.id} />
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-text">{a.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
