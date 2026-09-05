// Faculty & Staff list -- Design Architecture v0.1 module 05. Search + status
// filter chips (component 10) + a teaching-status filter + a paginated data table
// (component 18). Real data from GET /staff -- no mock rows.

import Link from "next/link";
import { CreateFacultyModal } from "@/components/faculty/CreateFacultyModal";
import { FacultyFilterBar } from "@/components/faculty/FacultyFilterBar";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import {
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

  return (
    <div className="mx-auto max-w-[1280px]">
      <SelectionProvider storageKey="id-card-selection:faculty">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Faculty &amp; Staff</h1>
          <p className="mt-1 text-sm text-text-muted">{meta.total} staff records</p>
        </div>
        <div className="flex items-center gap-3">
          <PrintIdCardsButton basePath="/print/faculty/id-cards" filterHref={printIdCardsHref()} />
          <CreateFacultyModal />
        </div>
      </div>

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

      <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="w-10 px-4 py-3">
                <SelectAllCheckbox ids={staff.map((s) => s.id)} />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Employee no.</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                  No staff match this filter.
                </td>
              </tr>
            )}
            {staff.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3">
                  <RowCheckbox id={member.id} />
                </td>
                <td className="px-4 py-3 font-semibold text-text">
                  <div className="flex items-center gap-2.5">
                    <PersonAvatar
                      photoUrl={member.photoUrl}
                      name={`${member.firstName} ${member.lastName ?? ""}`}
                      size={28}
                    />
                    {member.firstName} {member.lastName ?? ""}
                    {!member.isTeaching && (
                      <span className="text-xs font-normal text-text-muted">(Non-teaching)</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-text">{member.employeeNo}</td>
                <td className="px-4 py-3 text-text-muted">{member.designation ?? "—"}</td>
                <td className="px-4 py-3 text-text-muted">{formatDate(member.dateOfJoining)}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={statusTone(member.status)} label={member.status.replace(/_/g, " ")} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/faculty/${member.id}`} className="text-[13px] font-semibold text-primary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
