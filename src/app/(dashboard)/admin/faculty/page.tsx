// Faculty & Staff list -- Design Architecture v0.1 module 05. Search + status
// filter chips (component 10) + a teaching-status filter + a paginated data table
// (component 18). Real data from GET /staff -- no mock rows.

import Link from "next/link";
import { FacultyFilterBar } from "@/components/faculty/FacultyFilterBar";
import { DownloadMenu } from "@/components/dashboard/DownloadMenu";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import {
  ClearSelectionLink,
  PrintIdCardsButton,
  RowCheckbox,
  SelectAllCheckbox,
  SelectionProvider,
} from "@/components/dashboard/SelectableIdCards";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface StaffRow {
  id: string;
  firstName: string;
  lastName: string | null;
  employeeNo: string;
  designation: string | null;
  isTeaching: boolean;
  dateOfJoining: string;
  status: string;
  photoUrl: string | null;
}

interface Grade {
  id: string;
  name: string;
}

interface Section {
  id: string;
  gradeId: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

const STATUS_TABS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "EXITED", label: "Exited" },
];

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "EXITED") return "critical";
  return "pending";
}

export default async function FacultyPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    isTeaching?: string;
    designation?: string;
    gradeId?: string;
    sectionId?: string;
    subjectId?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.isTeaching) query.set("isTeaching", params.isTeaching);
  if (params.designation) query.set("designation", params.designation);
  if (params.isTeaching === "true") {
    if (params.gradeId) query.set("gradeId", params.gradeId);
    if (params.sectionId) query.set("sectionId", params.sectionId);
    if (params.subjectId) query.set("subjectId", params.subjectId);
  }
  query.set("page", String(page));
  query.set("limit", "50");

  const [res, gradesRes, sectionsRes, subjectsRes, nonTeachingDesigRes] = await Promise.all([
    apiFetch(`/staff?${query.toString()}`),
    apiFetch("/grades"),
    apiFetch("/sections?status=ACTIVE"),
    apiFetch("/subjects"),
    apiFetch("/staff/designations?isTeaching=false"),
  ]);

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load faculty</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: staff, meta } = (await res.json()) as {
    data: StaffRow[];
    meta: { page: number; limit: number; total: number };
  };
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  const { data: grades } = gradesRes.ok ? ((await gradesRes.json()) as { data: Grade[] }) : { data: [] };
  const { data: sections } = sectionsRes.ok ? ((await sectionsRes.json()) as { data: Section[] }) : { data: [] };
  const { data: subjects } = subjectsRes.ok ? ((await subjectsRes.json()) as { data: Subject[] }) : { data: [] };
  const { data: nonTeachingDesignations } = nonTeachingDesigRes.ok
    ? ((await nonTeachingDesigRes.json()) as { data: string[] })
    : { data: [] };

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.status) next.set("status", params.status);
    if (params.isTeaching) next.set("isTeaching", params.isTeaching);
    if (params.designation) next.set("designation", params.designation);
    if (params.gradeId) next.set("gradeId", params.gradeId);
    if (params.sectionId) next.set("sectionId", params.sectionId);
    if (params.subjectId) next.set("subjectId", params.subjectId);
    next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/admin/faculty?${next.toString()}`;
  }

  function printIdCardsHref() {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.status) next.set("status", params.status);
    if (params.isTeaching) next.set("isTeaching", params.isTeaching);
    if (params.designation) next.set("designation", params.designation);
    if (params.isTeaching === "true") {
      if (params.gradeId) next.set("gradeId", params.gradeId);
      if (params.sectionId) next.set("sectionId", params.sectionId);
      if (params.subjectId) next.set("subjectId", params.subjectId);
    }
    return `/print/faculty/id-cards?${next.toString()}`;
  }

  function filterQuery() {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.status) q.set("status", params.status);
    if (params.isTeaching) q.set("isTeaching", params.isTeaching);
    if (params.designation) q.set("designation", params.designation);
    if (params.isTeaching === "true") {
      if (params.gradeId) q.set("gradeId", params.gradeId);
      if (params.sectionId) q.set("sectionId", params.sectionId);
      if (params.subjectId) q.set("subjectId", params.subjectId);
    }
    return q.toString();
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <SelectionProvider storageKey="id-card-selection:faculty">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Faculty &amp; Staff</h1>
          <p className="mt-1 text-sm text-text-muted">Every teacher and staff member in the school.</p>
        </div>
        <div className="flex items-center gap-3">
          <DownloadMenu csvHref={`/api/export/faculty?${filterQuery()}`} pdfHref={`/print/faculty/roster?${filterQuery()}`} />
          <PrintIdCardsButton basePath="/print/faculty/id-cards" filterHref={printIdCardsHref()} />
          <Link
            href="/admin/faculty/admit"
            className="flex items-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,111,224,.25)] transition-opacity hover:opacity-90"
          >
            + Admit faculty
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <FacultyFilterBar
          search={params.search ?? ""}
          status={params.status}
          isTeaching={params.isTeaching ?? ""}
          designation={params.designation ?? ""}
          gradeId={params.gradeId ?? ""}
          sectionId={params.sectionId ?? ""}
          subjectId={params.subjectId ?? ""}
          grades={grades}
          sections={sections}
          subjects={subjects}
          nonTeachingDesignations={nonTeachingDesignations}
        />
        <ClearSelectionLink />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const active = (params.status ?? undefined) === tab.value;
          return (
            <Link
              key={tab.label}
              href={hrefWith({ status: tab.value, page: "1" })}
              className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                active ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {staff.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-text-muted">
          <SelectAllCheckbox ids={staff.map((s) => s.id)} />
          Select all on this page
        </div>
      )}

      {staff.length === 0 ? (
        <div className="mt-6 rounded-[16px] border border-border bg-surface px-4 py-10 text-center text-text-muted">
          No staff match this filter.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((member) => (
            <div
              key={member.id}
              className="relative rounded-[16px] border border-border bg-surface p-[18px] card-hover"
            >
              <div className="absolute right-3 top-3 z-10">
                <RowCheckbox id={member.id} />
              </div>
              <Link href={`/admin/faculty/${member.id}`} className="absolute inset-0" aria-label={`${member.firstName} ${member.lastName ?? ""}`} />
              <div className="pointer-events-none">
                <div className="flex items-center gap-3 pr-6">
                  <PersonAvatar photoUrl={member.photoUrl} name={`${member.firstName} ${member.lastName ?? ""}`} size={44} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-text">
                      {member.firstName} {member.lastName ?? ""}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {member.employeeNo} · {member.designation ?? (member.isTeaching ? "Teacher" : "Staff")}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-text-muted">Joined {formatDate(member.dateOfJoining)}</span>
                  <StatusPill tone={statusTone(member.status)} label={member.status.replace(/_/g, " ")} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
          <span>
            Page {meta.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={hrefWith({ page: String(page - 1) })} className="font-semibold text-primary">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={hrefWith({ page: String(page + 1) })} className="font-semibold text-primary">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
      </SelectionProvider>
    </div>
  );
}
