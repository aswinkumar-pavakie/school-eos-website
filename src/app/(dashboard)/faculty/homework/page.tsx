// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isHomework" screen
// (nav label "Upload homework"). Reuses EXISTING real data
// (listHomework/getHomeworkRoster) and actions unchanged.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listHomework, getHomeworkRoster, deleteHomework, type HomeworkItem } from "@/lib/faculty-api";
import { revalidatePath } from "next/cache";
import { Tabs } from "@/components/faculty-ui/Tabs";
import { Avatar } from "@/components/faculty-ui/Avatar";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { HomeworkFormModal } from "./HomeworkFormModal";
import { HomeworkCompleteToggle } from "./HomeworkCompleteToggle";
import { closeHomeworkAction } from "./actions";

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; hwId?: string; tab?: "DONE" | "NOT_DONE" }>;
}) {
  try {
    const { classId, hwId, tab } = await searchParams;
    const { items, classes, stats } = await listHomework();
    const activeTab = tab === "NOT_DONE" ? "NOT_DONE" : "DONE";
    const filtered = classId ? items.filter((h) => h.subjectOfferingId === classId) : items;
    const selected = filtered.find((h) => h.id === hwId) ?? filtered[0];

    async function deleteAction(id: string) {
      "use server";
      await deleteHomework(id);
      revalidatePath("/faculty/homework");
    }

    return (
      <div>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Upload homework</h1>
            <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
              Homework you assign to your subject classes · parents mark completion in their login
            </p>
          </div>
          <HomeworkFormModal
            classes={classes}
            trigger={
              <button type="button" style={{ border: 0, background: "var(--fac-primary)", color: "#fff", cursor: "pointer", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "12px 18px" }}>
                + New homework
              </button>
            }
          />
        </div>

        <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "18px 20px", marginTop: 22 }}>
          <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>OPEN {stats.open} · DUE TODAY {stats.dueToday} · UNGRADED {stats.ungraded}</div>
          <div className="flex flex-wrap gap-2.5" style={{ marginTop: 12 }}>
            <a
              href="/faculty/homework"
              style={{ border: "1px solid var(--fac-border)", borderRadius: 9, padding: "10px 16px", font: "600 13.5px/1 var(--fac-font-sans)", background: !classId ? "var(--fac-primary)" : "var(--fac-white)", color: !classId ? "#fff" : "var(--fac-body)" }}
            >
              All my classes
            </a>
            {classes.map((c) => (
              <a
                key={c.subjectOfferingId}
                href={`/faculty/homework?classId=${c.subjectOfferingId}`}
                style={{ border: "1px solid var(--fac-border)", borderRadius: 9, padding: "10px 16px", font: "600 13.5px/1 var(--fac-font-sans)", background: classId === c.subjectOfferingId ? "var(--fac-primary)" : "var(--fac-white)", color: classId === c.subjectOfferingId ? "#fff" : "var(--fac-body)" }}
              >
                {c.label}
              </a>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ marginTop: 18 }}>
            <FacultyEmptyState message="No homework in this filter." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_1.2fr]" style={{ marginTop: 18, alignItems: "start" }}>
            <div className="flex flex-col gap-3">
              {filtered.map((h) => {
                const pct = h.total > 0 ? Math.round((h.finishedCount / h.total) * 100) : 0;
                const active = h.id === selected?.id;
                return (
                  <a
                    key={h.id}
                    href={`/faculty/homework?${classId ? `classId=${classId}&` : ""}hwId=${h.id}`}
                    className="fac-hover-lift block"
                    style={{ border: "1px solid var(--fac-border)", borderRadius: 12, padding: "16px 18px", background: active ? "var(--fac-tint)" : "var(--fac-white)" }}
                  >
                    <span className="flex items-start gap-3.5">
                      <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--fac-tint)", color: "var(--fac-primary)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 12.5px/1 var(--fac-font-sans)", flex: "0 0 38px" }}>
                        {h.subjectName.slice(0, 2).toUpperCase()}
                      </span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: "block", font: "700 16px/1.35 var(--fac-font-sans)" }}>{h.title}</span>
                        <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 4 }}>
                          {h.subjectName} · {h.gradeName}-{h.sectionName}
                        </span>
                      </span>
                      <span style={{ font: "600 12px/1 var(--fac-font-sans)", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 20, padding: "7px 11px", whiteSpace: "nowrap" }}>
                        Due {new Date(h.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </span>
                    <span className="flex items-center gap-3" style={{ marginTop: 14 }}>
                      <span style={{ flex: 1, display: "block", height: 7, borderRadius: 4, background: "var(--fac-border)", overflow: "hidden" }}>
                        <span style={{ display: "block", height: "100%", background: "var(--fac-primary)", width: `${pct}%` }} />
                      </span>
                      <span className="fac-font-mono" style={{ font: "500 13.5px/1 var(--fac-font-mono)", color: "var(--fac-body)" }}>{h.finishedCount}/{h.total}</span>
                    </span>
                  </a>
                );
              })}
            </div>

            {selected && <HomeworkDetail homework={selected} tab={activeTab} classId={classId} onDelete={deleteAction} />}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load homework. Nothing was changed -- try again." />;
  }
}

async function HomeworkDetail({
  homework,
  tab,
  classId,
  onDelete,
}: {
  homework: HomeworkItem;
  tab: "DONE" | "NOT_DONE";
  classId?: string;
  onDelete: (id: string) => Promise<void>;
}) {
  const { roster } = await getHomeworkRoster(homework.id, tab);
  const pct = homework.total > 0 ? Math.round((homework.finishedCount / homework.total) * 100) : 0;
  const qs = classId ? `classId=${classId}&` : "";

  return (
    <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "20px 22px" }}>
      <div className="flex items-start justify-between gap-3.5">
        <div style={{ font: "700 20px/1.35 var(--fac-font-sans)" }}>{homework.title}</div>
        <span style={{ font: "600 12px/1 var(--fac-font-sans)", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 20, padding: "7px 11px", whiteSpace: "nowrap" }}>
          Due {new Date(homework.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </span>
      </div>
      <div className="flex items-end justify-between" style={{ marginTop: 16 }}>
        <div style={{ font: "700 34px/1 var(--fac-font-sans)" }}>
          {homework.finishedCount} <span style={{ font: "400 15px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>of {homework.total} completed</span>
        </div>
        <div style={{ font: "600 17px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}>{pct}%</div>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: "var(--fac-border)", marginTop: 12, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "var(--fac-primary)", width: `${pct}%` }} />
      </div>

      <div style={{ marginTop: 16 }}>
        <Tabs
          variant="tint"
          items={[
            { key: "DONE", label: "Completed", href: `/faculty/homework?${qs}hwId=${homework.id}&tab=DONE` },
            { key: "NOT_DONE", label: "Not submitted", href: `/faculty/homework?${qs}hwId=${homework.id}&tab=NOT_DONE` },
          ]}
          activeKey={tab}
        />
      </div>
      <p style={{ font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 14 }}>
        Parents can submit from their login -- you can also mark a submission yourself below (e.g. homework collected in class).
      </p>
      <div style={{ maxHeight: 340, overflow: "auto", marginTop: 6 }}>
        {roster.length === 0 ? (
          <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", padding: "14px 0" }}>
            {tab === "DONE" ? "No submissions yet." : "Everyone has submitted."}
          </p>
        ) : (
          roster.map((r) => (
            <div key={r.studentId} className="fac-hover-lift flex items-center gap-3.5" style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}>
              <Avatar initials={r.studentName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()} size="sm" />
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", font: "600 14.5px/1.3 var(--fac-font-sans)" }}>{r.studentName}</span>
                <span style={{ display: "block", font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Roll {r.rollNo ?? "--"}</span>
              </span>
              <HomeworkCompleteToggle homeworkId={homework.id} studentId={r.studentId} status={r.status} marksAwarded={r.marksAwarded} />
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2.5" style={{ marginTop: 14 }}>
        <HomeworkFormModal
          classes={[]}
          homework={homework}
          trigger={
            <button type="button" style={{ flex: 1, border: "1px solid var(--fac-border)", background: "var(--fac-white)", color: "var(--fac-body)", cursor: "pointer", font: "600 13.5px/1 var(--fac-font-sans)", borderRadius: 9, padding: "11px 0" }}>
              Edit
            </button>
          }
        />
        {homework.status === "PUBLISHED" && (
          <form action={closeHomeworkAction.bind(null, homework.id)} style={{ flex: 1 }}>
            <button type="submit" style={{ width: "100%", border: "1px solid var(--fac-border)", background: "var(--fac-white)", color: "var(--fac-body)", cursor: "pointer", font: "600 13.5px/1 var(--fac-font-sans)", borderRadius: 9, padding: "11px 0" }}>
              Close
            </button>
          </form>
        )}
        <form action={onDelete.bind(null, homework.id)} style={{ flex: 1 }}>
          <button type="submit" style={{ width: "100%", border: "1px solid var(--fac-red-bg)", background: "var(--fac-white)", color: "var(--fac-red-text)", cursor: "pointer", font: "600 13.5px/1 var(--fac-font-sans)", borderRadius: 9, padding: "11px 0" }}>
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
