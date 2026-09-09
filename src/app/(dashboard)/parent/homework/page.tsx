// Parent Homework -- real homework list scoped to the selected child (see
// parent/page.tsx's own `?studentId=` convention), each item's own real
// submission state, and a real multipart submit (note + files) wired
// straight to the already-shipped
// /parent/students/:id/homework/:id/submit endpoint -- the same backend
// the Parent mobile app's own Homework screen already calls.

import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  getHomeworkFileUrl,
  listChildren,
  listHomework,
  resolveSelectedChild,
  type ParentHomework,
} from "@/lib/parent-api";
import { SubmitHomeworkModal } from "./SubmitHomeworkModal";

type StatusFilter = "ALL" | "PENDING" | "SUBMITTED" | "GRADED" | "NOT_DONE";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "GRADED", label: "Graded" },
  { value: "NOT_DONE", label: "Not submitted" },
];

export default async function ParentHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; status?: string }>;
}) {
  try {
    const { studentId: requestedStudentId, status } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const homework = await listHomework(selected.studentId);
    const activeFilter: StatusFilter = FILTERS.some((f) => f.value === status) ? (status as StatusFilter) : "ALL";
    const filtered = activeFilter === "ALL" ? homework : homework.filter((h) => h.submissionStatus === activeFilter);
    const fileLinks = await resolveFileLinks(selected.studentId, filtered);

    return (
      <div className="mx-auto flex max-w-[960px] flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Homework</h1>
            <p className="mt-1 text-sm text-text-muted">
              {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join(" ")}
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/parent/homework?studentId=${selected.studentId}${f.value === "ALL" ? "" : `&status=${f.value}`}`}
              className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-bold ${
                activeFilter === f.value ? "bg-primary text-white" : "bg-field text-text-muted"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No homework here" body="Nothing matches this filter yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((hw) => (
              <HomeworkCard key={hw.id} studentId={selected.studentId} homework={hw} fileLinks={fileLinks[hw.id] ?? []} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load homework. Nothing was changed — try again." />;
  }
}

async function resolveFileLinks(
  studentId: string,
  homework: ParentHomework[],
): Promise<Record<string, { key: string; url: string }[]>> {
  const entries = await Promise.all(
    homework.map(async (hw) => {
      const keys = hw.objectKeys ?? [];
      if (keys.length === 0) return [hw.id, []] as const;
      const links = await Promise.all(
        keys.map(async (key) => ({ key, url: await getHomeworkFileUrl(studentId, hw.id, key).catch(() => "") })),
      );
      return [hw.id, links.filter((l) => l.url)] as const;
    }),
  );
  return Object.fromEntries(entries);
}

function HomeworkCard({
  studentId,
  homework,
  fileLinks,
}: {
  studentId: string;
  homework: ParentHomework;
  fileLinks: { key: string; url: string }[];
}) {
  const isGraded = homework.submissionStatus === "GRADED";

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wide text-text-muted uppercase">{homework.subjectName}</p>
          <p className="text-sm font-bold text-text">{homework.title}</p>
          <p className="text-xs text-text-muted">
            Assigned {formatDate(homework.assignedOn)} · Due {formatDate(homework.dueDate)}
            {homework.maxMarks !== null ? ` · Max ${homework.maxMarks}` : ""}
          </p>
        </div>
        <StatusPill state={homework.submissionStatus} />
      </div>

      {homework.description ? <p className="mt-2 text-sm text-text">{homework.description}</p> : null}

      {homework.attachmentKeys && homework.attachmentKeys.length > 0 ? (
        <p className="mt-2 text-xs text-text-muted">{homework.attachmentKeys.length} reference file(s) from the teacher.</p>
      ) : null}

      {homework.submittedAt ? (
        <p className="mt-2 text-xs text-text-muted">
          Submitted {formatDate(homework.submittedAt)}
          {homework.isLate ? " · Late" : ""}
        </p>
      ) : null}

      {homework.note ? <p className="mt-1 text-sm text-text-muted">Your note: {homework.note}</p> : null}

      {fileLinks.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-3">
          {fileLinks.map((f, i) => (
            <a key={f.key} href={f.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline">
              {fileLinks.length > 1 ? `Open ${i + 1}` : "Open"}
            </a>
          ))}
        </div>
      ) : null}

      {isGraded ? (
        <div className="mt-3 rounded-[var(--radius-input)] border border-border bg-field p-3">
          <p className="text-sm font-bold text-text">
            Marks: {homework.marksAwarded !== null ? `${homework.marksAwarded}${homework.maxMarks ? ` / ${homework.maxMarks}` : ""}` : "—"}
          </p>
          {homework.feedback ? <p className="mt-1 text-sm text-text-muted">{homework.feedback}</p> : null}
        </div>
      ) : (
        <div className="mt-3">
          <SubmitHomeworkModal studentId={studentId} homework={homework} />
        </div>
      )}
    </div>
  );
}
