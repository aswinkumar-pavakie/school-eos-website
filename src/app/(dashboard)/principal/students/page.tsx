// Principal's Students list -- read-only oversight, reusing Admin's exact list
// design (search/filter, status tabs, paginated table) and the same real
// GET /students endpoint. Deliberately excludes Admin's write/operational
// controls (Create student, bulk ID-card selection/print) -- Principal browses
// and views, never creates or bulk-operates on records.

import Link from "next/link";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { StudentsFilterBar } from "@/components/students/StudentsFilterBar";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  admissionDate: string;
  status: string;
  isHosteller: boolean;
  gradeId: string | null;
  gradeName: string | null;
  sectionId: string | null;
  sectionName: string | null;
  rollNo: number | null;
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

const STATUS_TABS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "LEFT", label: "Left" },
  { value: "TC_ISSUED", label: "TC issued" },
  { value: "ARCHIVED", label: "Archived" },
];

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "TC_ISSUED" || status === "ARCHIVED") return "critical";
  return "pending";
}

export default async function PrincipalStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    gradeId?: string;
    sectionId?: string;
    sectionName?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.sectionId) query.set("sectionId", params.sectionId);
  else if (params.gradeId) query.set("gradeId", params.gradeId);
  else if (params.sectionName) query.set("sectionName", params.sectionName);
  query.set("page", String(page));
  query.set("limit", "50");

  const [res, gradesRes, sectionsRes] = await Promise.all([
    apiFetch(`/students?${query.toString()}`),
    apiFetch("/grades"),
    apiFetch("/sections?status=ACTIVE"),
  ]);

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load students</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: students, meta } = (await res.json()) as {
    data: StudentRow[];
    meta: { page: number; limit: number; total: number };
  };
  const grades = gradesRes.ok ? ((await gradesRes.json()) as { data: Grade[] }).data : [];
  const sections = sectionsRes.ok ? ((await sectionsRes.json()) as { data: Section[] }).data : [];
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.status) next.set("status", params.status);
    if (params.gradeId) next.set("gradeId", params.gradeId);
    if (params.sectionId) next.set("sectionId", params.sectionId);
    if (params.sectionName) next.set("sectionName", params.sectionName);
    next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/principal/students?${next.toString()}`;
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Students</h1>
          <p className="mt-1 text-sm text-text-muted">{meta.total} student records</p>
        </div>
      </div>

      <StudentsFilterBar
        grades={grades}
        sections={sections}
        search={params.search ?? ""}
        gradeId={params.gradeId ?? ""}
        sectionId={params.sectionId ?? ""}
        sectionName={params.sectionName}
        status={params.status}
        formActionOverride="/principal/students"
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
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Admission no.</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Admitted</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                  No students match this filter.
                </td>
              </tr>
            )}
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-field">
                <td className="px-4 py-3 font-semibold text-text">
                  <Link href={`/principal/students/${student.id}`} className="flex items-center gap-2.5 hover:text-primary hover:underline">
                    <PersonAvatar
                      photoUrl={student.photoUrl}
                      name={`${student.firstName} ${student.lastName ?? ""}`}
                      size={28}
                    />
                    {student.firstName} {student.lastName ?? ""}
                    {student.isHosteller && (
                      <span className="text-xs font-normal text-text-muted">(Hosteller)</span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-text">{student.admissionNo}</td>
                <td className="px-4 py-3 text-text-muted">
                  {student.gradeName ? (
                    <>
                      {student.gradeName} · {student.sectionName}
                    </>
                  ) : (
                    "Unassigned"
                  )}
                </td>
                <td className="px-4 py-3 text-text-muted">{formatDate(student.admissionDate)}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={statusTone(student.status)} label={student.status.replace(/_/g, " ")} />
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
    </div>
  );
}
