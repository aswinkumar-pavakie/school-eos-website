// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isOnline" screen
// (list/schedule/recordings sub-views). Real data via faculty-online-
// classes-api.ts against online-classes.controller.ts.
//
// Start/Resume now navigate to the in-app LiveKit call screen
// (online-class-call/[id]) instead of opening an external Google Meet link
// -- see that route's CallRoom.tsx for the actual video UI. The old
// Google Calendar/Meet integration stays live in the backend for any
// historical row that still has a meetingUrl, but nothing here uses it for
// a class scheduled from this point on.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listOnlineClasses, myOnlineClassOfferings, scheduleOnlineClass, type OnlineClassDetail } from "@/lib/faculty-online-classes-api";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { ChevronLeftIcon } from "@/components/faculty-ui/icons";

function ArrowBackButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      style={{ width: 36, height: 36, border: "1px solid var(--fac-border)", background: "var(--fac-white)", borderRadius: 9, color: "var(--fac-body-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <ChevronLeftIcon />
    </a>
  );
}

function isToday(dateStr: string): boolean {
  return dateStr.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

/** A short, deterministic display code derived from the real class id -- purely
 * cosmetic (matches the design's "pps-mat-882" style session code), never a
 * separately-stored/fabricated value. */
function sessionCode(s: OnlineClassDetail): string {
  const subjectPart = s.subjectName.replace(/[^a-z]/gi, "").slice(0, 3).toLowerCase() || "cls";
  const numeric = parseInt(s.id.replace(/-/g, "").slice(0, 6), 16) % 1000;
  return `pps-${subjectPart}-${String(numeric).padStart(3, "0")}`;
}

/** Minutes until this class's scheduled start (negative if already started). Purely a
 * UI affordance to gray out "Start" until close to the scheduled time -- the backend
 * itself doesn't restrict when a faculty can start their own class. */
function minutesUntilStart(s: OnlineClassDetail): number {
  const startsAt = new Date(`${s.scheduledDate}T${s.startTime}`);
  return (startsAt.getTime() - Date.now()) / 60000;
}

const JOINABLE_LEAD_MINUTES = 15;

export default async function OnlineClassPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  let view: string | undefined;
  try {
    ({ view } = await searchParams);
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load online classes. Nothing was changed -- try again." />;
  }

  if (view === "schedule") return <ScheduleView />;
  if (view === "recordings") return <RecordingsView />;
  return <ListView />;
}

async function ListView() {
  const sessions = await listOnlineClasses("upcoming");
  const todays = sessions.filter((s) => isToday(s.scheduledDate));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Online class</h1>
          <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
            Live sessions for your subject classes · parents see the session as soon as you schedule it
          </p>
        </div>
        <div className="flex gap-2.5">
          <a href="/faculty/online-class?view=recordings" className="fac-hover-lift" style={{ border: "1px solid var(--fac-border)", background: "var(--fac-white)", font: "600 14px/1 var(--fac-font-sans)", color: "var(--fac-navy)", borderRadius: 9, padding: "12px 18px", display: "inline-block" }}>
            Recordings
          </a>
          <a href="/faculty/online-class?view=schedule" style={{ border: 0, background: "var(--fac-primary)", color: "#fff", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "12px 18px", display: "inline-block" }}>
            + Schedule class
          </a>
        </div>
      </div>

      <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", margin: "24px 0 12px" }}>TODAY&rsquo;S SESSIONS</div>
      {todays.length === 0 ? (
        <FacultyEmptyState message="No sessions scheduled for today." />
      ) : (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          {todays.map((s) => (
            <div key={s.id} className="fac-hover-lift" style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "18px 20px" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div style={{ font: "700 18px/1.2 var(--fac-font-sans)" }}>{s.subjectName}</div>
                  <div style={{ font: "400 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>{s.gradeName}-{s.sectionName} · {s.startTime.slice(0, 5)}-{s.endTime.slice(0, 5)}</div>
                </div>
                <span style={{ font: "600 12px/1 var(--fac-font-sans)", borderRadius: 20, padding: "7px 12px", whiteSpace: "nowrap", background: s.status === "LIVE" ? "var(--fac-tint)" : "var(--fac-divider)", color: s.status === "LIVE" ? "var(--fac-primary)" : "var(--fac-body)" }}>
                  {s.status === "LIVE" ? "Live now" : "Scheduled"}
                </span>
              </div>
              <div style={{ font: "500 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body)", marginTop: 13 }}>{s.topic}</div>
              <div className="flex items-center justify-between" style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--fac-divider)" }}>
                <span className="fac-font-mono" style={{ font: "400 13.5px/1 var(--fac-font-mono)", color: "var(--fac-tertiary)" }}>{sessionCode(s)}</span>
                {s.status === "LIVE" ? (
                  <Link href={`/online-class-call/${s.id}`} style={{ border: 0, cursor: "pointer", borderRadius: 9, padding: "11px 22px", font: "600 14px/1 var(--fac-font-sans)", background: "var(--fac-primary)", color: "#fff" }}>
                    Resume
                  </Link>
                ) : minutesUntilStart(s) <= JOINABLE_LEAD_MINUTES ? (
                  <Link href={`/online-class-call/${s.id}`} style={{ border: 0, cursor: "pointer", borderRadius: 9, padding: "11px 22px", font: "600 14px/1 var(--fac-font-sans)", background: "var(--fac-primary)", color: "#fff" }}>
                    Start
                  </Link>
                ) : (
                  <span style={{ font: "600 14px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Not yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.length > todays.length && (
        <>
          <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", margin: "24px 0 12px" }}>UPCOMING</div>
          <div className="flex flex-col gap-3">
            {sessions.filter((s) => !isToday(s.scheduledDate)).map((s) => (
              <UpcomingRow key={s.id} s={s} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UpcomingRow({ s }: { s: OnlineClassDetail }) {
  return (
    <div className="fac-hover-lift flex items-center gap-3.5" style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "14px 18px" }}>
      <div style={{ flex: 1 }}>
        <span style={{ display: "block", font: "600 15px/1.3 var(--fac-font-sans)" }}>{s.subjectName} · {s.topic}</span>
        <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
          {new Date(s.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {s.startTime.slice(0, 5)}
        </span>
      </div>
    </div>
  );
}

async function ScheduleView() {
  const offerings = await myOnlineClassOfferings();

  async function submit(formData: FormData) {
    "use server";
    const start = String(formData.get("startTime"));
    const durationMin = Number(formData.get("duration") ?? 45);
    const [h, m] = start.split(":").map(Number);
    const endMinutes = h * 60 + m + durationMin;
    const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
    await scheduleOnlineClass({
      subjectOfferingId: String(formData.get("subjectOfferingId")),
      topic: String(formData.get("topic")),
      scheduledDate: String(formData.get("scheduledDate")),
      startTime: start,
      endTime,
    });
    redirect("/faculty/online-class");
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="flex items-center gap-3.5">
        <ArrowBackButton href="/faculty/online-class" />
        <h1 style={{ margin: 0, font: "700 32px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Schedule class</h1>
      </div>
      <form action={submit} style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 22, marginTop: 20 }}>
        <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", marginBottom: 8 }}>CLASS</div>
        <select name="subjectOfferingId" required defaultValue="" style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }}>
          <option value="" disabled>Select…</option>
          {offerings.map((o) => (
            <option key={o.id} value={o.id}>{o.subjectName} · {o.gradeName}-{o.sectionName}</option>
          ))}
        </select>
        <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", margin: "18px 0 8px" }}>TOPIC</div>
        <input name="topic" required placeholder="e.g. Linear equations — revision" style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
          <div>
            <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", marginBottom: 8 }}>DATE</div>
            <input type="date" name="scheduledDate" required style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "12px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />
          </div>
          <div>
            <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", marginBottom: 8 }}>START TIME</div>
            <input type="time" name="startTime" required style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "12px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />
          </div>
        </div>
        <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", margin: "18px 0 8px" }}>DURATION</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[30, 45, 60].map((d, i) => (
            <label key={d} style={{ border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 0", textAlign: "center", font: "600 14px/1 var(--fac-font-sans)", cursor: "pointer" }}>
              <input type="radio" name="duration" value={d} defaultChecked={i === 1} style={{ marginRight: 6 }} />
              {d} min
            </label>
          ))}
        </div>
        <div style={{ background: "var(--fac-tint)", borderRadius: 11, padding: 14, marginTop: 18, font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-primary)" }}>
          Parents of the class see this session in their app as soon as you schedule it.
        </div>
        <button type="submit" style={{ width: "100%", marginTop: 18, border: 0, cursor: "pointer", borderRadius: 11, padding: 15, font: "600 15.5px/1 var(--fac-font-sans)", color: "#fff", background: "var(--fac-primary)" }}>
          Schedule class
        </button>
      </form>
    </div>
  );
}

async function RecordingsView() {
  const completed = await listOnlineClasses("completed");
  const recordings = completed.filter((c) => c.recordingUrl);

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="flex items-center gap-3.5">
        <ArrowBackButton href="/faculty/online-class" />
        <h1 style={{ margin: 0, font: "700 32px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Recordings</h1>
      </div>
      <div className="flex flex-col gap-3" style={{ marginTop: 20 }}>
        {recordings.length === 0 ? (
          <FacultyEmptyState message="No recordings yet." />
        ) : (
          recordings.map((r) => (
            <a
              key={r.id}
              href={r.recordingUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="fac-hover-lift flex items-center gap-3.5"
              style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "16px 18px" }}
            >
              <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--fac-tint)", color: "var(--fac-primary)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 14px/1 var(--fac-font-sans)" }}>
                &#9654;
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", font: "600 16px/1.3 var(--fac-font-sans)" }}>{r.topic}</span>
                <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>
                  {r.subjectName} · {new Date(r.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </span>
              <span style={{ font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}>Open</span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
