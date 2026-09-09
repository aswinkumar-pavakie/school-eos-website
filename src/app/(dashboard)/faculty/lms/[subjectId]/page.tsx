import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { listLmsSubjects, listLmsFolders, listLmsTasks, listLmsLessonPlans } from "@/lib/faculty-lms-api";
import { FolderModal } from "../_shared/FolderModal";
import { TaskModal } from "./TaskModal";
import { LessonPlanModal } from "./LessonPlanModal";
import { deleteTaskAction, deleteLessonPlanAction, toggleTaskStatusAction } from "../actions";

type Tab = "materials" | "tasks" | "lesson-plans";

export default async function LmsSubjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ tab?: string; classId?: string }>;
}) {
  try {
    const { subjectId } = await params;
    const { tab, classId } = await searchParams;
    const activeTab: Tab = tab === "tasks" ? "tasks" : tab === "lesson-plans" ? "lesson-plans" : "materials";

    const subjects = await listLmsSubjects();
    const subject = subjects.find((s) => s.subjectId === subjectId);
    if (!subject) {
      return <EmptyState title="Subject not found" body="This subject is not in your teaching scope." />;
    }

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">{subject.subjectName}</h1>
          <p className="mt-1 text-sm text-text-muted">{subject.classes.length} class{subject.classes.length === 1 ? "" : "es"}</p>
        </div>

        <div className="flex gap-2 border-b border-border">
          {(["materials", "tasks", "lesson-plans"] as Tab[]).map((t) => (
            <Link
              key={t}
              href={`/faculty/lms/${subjectId}?tab=${t}`}
              className={`px-3 py-2 text-sm font-bold capitalize ${activeTab === t ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}
            >
              {t.replace("-", " ")}
            </Link>
          ))}
        </div>

        {activeTab === "materials" ? (
          <MaterialsTab subjectId={subjectId} classes={subject.classes} />
        ) : activeTab === "tasks" ? (
          <TasksTab subjectId={subjectId} classes={subject.classes} classId={classId} />
        ) : (
          <LessonPlansTab subjectId={subjectId} classes={subject.classes} classId={classId} />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this subject. Nothing was changed — try again." />;
  }
}

async function MaterialsTab({ subjectId, classes }: { subjectId: string; classes: { subjectOfferingId: string; gradeName: string; sectionName: string }[] }) {
  const folders = await listLmsFolders(subjectId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end"><FolderModal subjectId={subjectId} classes={classes} /></div>
      {folders.length === 0 ? (
        <EmptyState title="No material folders yet" body="Create your first folder above." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((f) => (
            <Link key={f.id} href={`/faculty/lms/folder/${f.id}`} className="rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <p className="text-sm font-bold text-text">{f.title}</p>
              <p className="mt-1 text-xs text-text-muted">{f.files.length} file{f.files.length === 1 ? "" : "s"} · shared with {f.shareOfferingIds.length} class{f.shareOfferingIds.length === 1 ? "" : "es"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassPicker({ basePath, classes, classId, tab }: { basePath: string; classes: { subjectOfferingId: string; gradeName: string; sectionName: string }[]; classId?: string; tab: string }) {
  const selected = classId && classes.some((c) => c.subjectOfferingId === classId) ? classId : classes[0]?.subjectOfferingId;
  return (
    <form action={basePath} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="tab" value={tab} />
      <select name="classId" defaultValue={selected} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
        {classes.map((c) => (
          <option key={c.subjectOfferingId} value={c.subjectOfferingId}>{c.gradeName} {c.sectionName}</option>
        ))}
      </select>
      <PlainButton type="submit" variant="secondary">Go</PlainButton>
    </form>
  );
}

async function TasksTab({ subjectId, classes, classId }: { subjectId: string; classes: { subjectOfferingId: string; gradeName: string; sectionName: string }[]; classId?: string }) {
  const selected = classId && classes.some((c) => c.subjectOfferingId === classId) ? classId : classes[0]?.subjectOfferingId;

  return (
    <div className="flex flex-col gap-4">
      <ClassPicker basePath={`/faculty/lms/${subjectId}`} classes={classes} classId={classId} tab="tasks" />
      {selected ? <TaskList subjectOfferingId={selected} /> : null}
    </div>
  );
}

async function TaskList({ subjectOfferingId }: { subjectOfferingId: string }) {
  const tasks = await listLmsTasks(subjectOfferingId);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end"><TaskModal subjectOfferingId={subjectOfferingId} /></div>
      {tasks.length === 0 ? (
        <EmptyState title="No tasks for this class yet" body="Create one above." />
      ) : (
        tasks.map((t) => (
          <div key={t.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">{t.title}</p>
                {t.dueDate ? <p className="text-xs text-text-muted">Due {formatDate(t.dueDate)}</p> : null}
              </div>
              <form action={toggleTaskStatusAction.bind(null, t.id, t.status === "OPEN" ? "CLOSED" : "OPEN")}>
                <button type="submit" className={`rounded-[7px] px-2 py-0.5 text-xs font-bold uppercase ${t.status === "OPEN" ? "bg-success-bg text-success-text" : "bg-field text-text-muted"}`}>
                  {t.status}
                </button>
              </form>
            </div>
            {t.description ? <p className="mt-2 text-sm text-text">{t.description}</p> : null}
            <div className="mt-3 flex gap-2">
              <TaskModal subjectOfferingId={subjectOfferingId} task={t} />
              <form action={deleteTaskAction.bind(null, t.id)}>
                <PlainButton type="submit" variant="danger">Delete</PlainButton>
              </form>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

async function LessonPlansTab({ subjectId, classes, classId }: { subjectId: string; classes: { subjectOfferingId: string; gradeName: string; sectionName: string }[]; classId?: string }) {
  const selected = classId && classes.some((c) => c.subjectOfferingId === classId) ? classId : classes[0]?.subjectOfferingId;

  return (
    <div className="flex flex-col gap-4">
      <ClassPicker basePath={`/faculty/lms/${subjectId}`} classes={classes} classId={classId} tab="lesson-plans" />
      {selected ? <LessonPlanList subjectOfferingId={selected} /> : null}
    </div>
  );
}

async function LessonPlanList({ subjectOfferingId }: { subjectOfferingId: string }) {
  const plans = await listLmsLessonPlans(subjectOfferingId);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end"><LessonPlanModal subjectOfferingId={subjectOfferingId} /></div>
      {plans.length === 0 ? (
        <EmptyState title="No lesson plans for this class yet" body="Create one above." />
      ) : (
        plans.map((p) => (
          <div key={p.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <p className="text-sm font-bold text-text">{p.title}</p>
            {p.weekStart ? <p className="text-xs text-text-muted">Week of {formatDate(p.weekStart)}</p> : null}
            <p className="mt-2 whitespace-pre-wrap text-sm text-text">{p.content}</p>
            <div className="mt-3 flex gap-2">
              <LessonPlanModal subjectOfferingId={subjectOfferingId} plan={p} />
              <form action={deleteLessonPlanAction.bind(null, p.id)}>
                <PlainButton type="submit" variant="danger">Delete</PlainButton>
              </form>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
