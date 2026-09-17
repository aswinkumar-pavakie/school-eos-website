// Daily Tasks / Homework -- pixel-rebuilt from the design's own
// isDailyTasks screen. Real homework data (listHomework/submitHomework),
// same /parent/students/:id/homework endpoints already established.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill, type PillTone } from "@/components/parent-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getHomeworkFileUrl, listChildren, listHomework, resolveSelectedChild, type ParentHomework } from "@/lib/parent-api";
import { SubmitHomeworkPanel } from "./SubmitHomeworkPanel";

type StatusFilter = "ALL" | "PENDING" | "SUBMITTED" | "GRADED" | "NOT_DONE";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "GRADED", label: "Graded" },
  { value: "NOT_DONE", label: "Not submitted" },
];

const STATUS_TONE: Record<ParentHomework["submissionStatus"], PillTone> = {
  PENDING: "amber",
  SUBMITTED: "blue",
  LATE: "red",
  GRADED: "blue",
  NOT_DONE: "red",
};

export default async function ParentHomeworkPage({ searchParams }: { searchParams: Promise<{ studentId?: string; status?: string }> }) {
  try {
    const { studentId: requestedStudentId, status } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const homework = await listHomework(selected.studentId);
    const activeFilter: StatusFilter = FILTERS.some((f) => f.value === status) ? (status as StatusFilter) : "ALL";
    const filtered = activeFilter === "ALL" ? homework : homework.filter((h) => h.submissionStatus === activeFilter);
    const fileLinks = await resolveFileLinks(selected.studentId, filtered);

    return (
      <div className="parent-scope">
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--par-ink)" }}>Daily Tasks</div>
          <div style={{ fontSize: 15, color: "var(--par-body-muted)" }}>Homework for {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join("-")}</div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <a key={f.value} href={`/parent/homework?studentId=${selected.studentId}${f.value === "ALL" ? "" : `&status=${f.value}`}`} style={{ textDecoration: "none" }}>
              <span
                style={{
                  display: "inline-block",
                  borderRadius: 9,
                  padding: "9px 16px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  background: activeFilter === f.value ? "var(--par-navy)" : "#fff",
                  color: activeFilter === f.value ? "#fff" : "var(--par-ink)",
                  border: activeFilter === f.value ? undefined : "1px solid var(--par-border)",
                }}
              >
                {f.label}
              </span>
            </a>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyPanel label="Nothing matches this filter yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map((hw) => (
              <HomeworkCard key={hw.id} studentId={selected.studentId} homework={hw} fileLinks={fileLinks[hw.id] ?? []} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load homework."} />;
  }
}

async function resolveFileLinks(studentId: string, homework: ParentHomework[]): Promise<Record<string, { key: string; url: string }[]>> {
  const entries = await Promise.all(
    homework.map(async (hw) => {
      const keys = hw.objectKeys ?? [];
      if (keys.length === 0) return [hw.id, []] as const;
      const links = await Promise.all(keys.map(async (key) => ({ key, url: await getHomeworkFileUrl(studentId, hw.id, key).catch(() => "") })));
      return [hw.id, links.filter((l) => l.url)] as const;
    }),
  );
  return Object.fromEntries(entries);
}

function HomeworkCard({ studentId, homework, fileLinks }: { studentId: string; homework: ParentHomework; fileLinks: { key: string; url: string }[] }) {
  const isGraded = homework.submissionStatus === "GRADED";

  return (
    <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card-sm)", padding: "18px 22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>{homework.subjectName}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--par-ink)" }}>{homework.title}</div>
          <div style={{ fontSize: 12.5, color: "var(--par-body-muted)", marginTop: 2 }}>
            Assigned {formatDate(homework.assignedOn)} · Due {formatDate(homework.dueDate)}
            {homework.maxMarks !== null ? ` · Max ${homework.maxMarks}` : ""}
          </div>
        </div>
        <StatusPill label={homework.submissionStatus.replace("_", " ")} tone={STATUS_TONE[homework.submissionStatus]} />
      </div>

      {homework.description && <div style={{ fontSize: 14, color: "var(--par-body)", marginBottom: 10 }}>{homework.description}</div>}

      {homework.attachmentKeys && homework.attachmentKeys.length > 0 && (
        <div style={{ fontSize: 12.5, color: "var(--par-tertiary-2)", marginBottom: 10 }}>{homework.attachmentKeys.length} reference file(s) from the teacher.</div>
      )}

      {homework.submittedAt && (
        <div style={{ fontSize: 12.5, color: "var(--par-body-muted)", marginBottom: 6 }}>
          Submitted {formatDate(homework.submittedAt)}
          {homework.isLate ? " · Late" : ""}
        </div>
      )}
      {homework.note && <div style={{ fontSize: 13.5, color: "var(--par-body-muted)", marginBottom: 8 }}>Your note: {homework.note}</div>}

      {fileLinks.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 10 }}>
          {fileLinks.map((f, i) => (
            <a key={f.key} href={f.url} target="_blank" rel="noreferrer" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--par-primary)" }}>
              {fileLinks.length > 1 ? `Open ${i + 1}` : "Open"}
            </a>
          ))}
        </div>
      )}

      {isGraded ? (
        <div style={{ borderRadius: "var(--par-radius-input)", background: "var(--par-panel-2)", padding: 14, marginTop: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--par-ink)" }}>
            Marks: {homework.marksAwarded !== null ? `${homework.marksAwarded}${homework.maxMarks ? ` / ${homework.maxMarks}` : ""}` : "—"}
          </div>
          {homework.feedback && <div style={{ fontSize: 13.5, color: "var(--par-body-muted)", marginTop: 4 }}>{homework.feedback}</div>}
        </div>
      ) : (
        <div style={{ marginTop: 4 }}>
          <SubmitHomeworkPanel studentId={studentId} homework={homework} />
        </div>
      )}
    </div>
  );
}
