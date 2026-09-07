import Link from "next/link";
import type { MediaPost } from "@/lib/media-api";
import { formatDate } from "@/lib/format";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function ContentCalendarPanel({ posts, year, month }: { posts: MediaPost[]; year: number; month: number }) {
  // month is 0-indexed
  const relevant = posts.filter((p) => p.state === "SCHEDULED" || p.state === "PUBLISHED");
  const byDay = new Map<string, MediaPost[]>();
  for (const post of relevant) {
    const when = post.publishedAt ?? post.publishAt;
    if (!when) continue;
    const key = dayKey(when);
    if (key.slice(0, 7) !== `${year}-${String(month + 1).padStart(2, "0")}`) continue;
    byDay.set(key, [...(byDay.get(key) ?? []), post]);
  }

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0=Sun..6=Sat -> convert to Mon-first index
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const prevMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  const today = new Date();
  const isCurrentMonthRealToday = today.getFullYear() === year && today.getMonth() === month;

  const thisMonthPosts = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <Link href={`?tab=calendar&year=${prevMonth.year}&month=${prevMonth.month}`} className="text-text-muted hover:text-text">‹</Link>
          <div className="text-center">
            <p className="text-base font-extrabold text-text">{MONTH_NAMES[month]} {year}</p>
            <p className="text-xs text-text-muted">{relevant.filter((p) => dayKey((p.publishedAt ?? p.publishAt)!).slice(0, 7) === `${year}-${String(month + 1).padStart(2, "0")}`).length} posts this month</p>
          </div>
          <Link href={`?tab=calendar&year=${nextMonth.year}&month=${nextMonth.month}`} className="text-text-muted hover:text-text">›</Link>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-text-muted">
          {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasPosts = byDay.has(key);
            const isToday = isCurrentMonthRealToday && today.getDate() === day;
            return (
              <div
                key={day}
                className={`flex aspect-square flex-col items-center justify-center rounded-[var(--radius-input)] text-sm ${
                  isToday ? "border border-primary font-extrabold text-primary" : "text-text"
                }`}
              >
                {day}
                {hasPosts ? <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" /> : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <h2 className="mb-1 text-sm font-bold text-text">This month</h2>
        <p className="mb-3 text-xs text-text-muted">Scheduled drafts and published posts</p>
        {thisMonthPosts.length === 0 ? (
          <p className="text-sm text-text-muted">Nothing scheduled.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {thisMonthPosts.map(([key, dayPosts]) => (
              <div key={key}>
                <p className="text-xs font-bold text-text-muted">{formatDate(key)}</p>
                {dayPosts.map((post) => (
                  <p key={post.id} className="mt-1 line-clamp-1 text-sm text-text">
                    {post.state === "SCHEDULED" ? "🕒 " : "✅ "}{post.caption}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
