import Link from "next/link";
import type { MediaPost } from "@/lib/media-api";
import { formatDate } from "@/lib/format";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function ContentCalendarPanel({ posts, year, month }: { posts: MediaPost[]; year: number; month: number }) {
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
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const prevMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  const today = new Date();
  const isCurrentMonthRealToday = today.getFullYear() === year && today.getMonth() === month;

  const thisMonthPosts = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  const postsThisMonth = relevant.filter((p) => dayKey((p.publishedAt ?? p.publishAt)!).slice(0, 7) === `${year}-${String(month + 1).padStart(2, "0")}`).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, marginTop: 28, alignItems: "start" }}>
      <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href={`?tab=calendar&year=${prevMonth.year}&month=${prevMonth.month}`} style={{ fontSize: 18, color: "var(--med-body-muted)" }}>‹</Link>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{MONTH_NAMES[month]} {year}</div>
            <div style={{ fontSize: 12.5, color: "var(--med-tertiary)" }}>{postsThisMonth} posts this month</div>
          </div>
          <Link href={`?tab=calendar&year=${nextMonth.year}&month=${nextMonth.month}`} style={{ fontSize: 18, color: "var(--med-body-muted)" }}>›</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginTop: 18, textAlign: "center" }}>
          {WEEKDAYS.map((d) => (
            <div key={d} style={{ fontSize: 12, fontWeight: 700, color: "var(--med-tertiary)" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginTop: 8 }}>
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`b${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasPosts = byDay.has(key);
            const isToday = isCurrentMonthRealToday && today.getDate() === day;
            return (
              <div key={day} style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 10, fontSize: 14, border: isToday ? "1px solid var(--med-primary)" : undefined, fontWeight: isToday ? 800 : 500, color: isToday ? "var(--med-primary)" : "var(--med-ink)" }}>
                {day}
                {hasPosts && <span style={{ marginTop: 3, width: 6, height: 6, borderRadius: "50%", background: "var(--med-primary)" }} />}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>This month</div>
        <div style={{ fontSize: 13.5, color: "var(--med-body-muted)", marginTop: 4 }}>Scheduled drafts and published posts</div>
        {thisMonthPosts.length === 0 ? (
          <div style={{ fontSize: 13.5, color: "var(--med-tertiary)", marginTop: 16 }}>Nothing scheduled.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
            {thisMonthPosts.map(([key, dayPosts]) => (
              <div key={key}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--med-tertiary)" }}>{formatDate(key)}</div>
                {dayPosts.map((post) => (
                  <div key={post.id} style={{ fontSize: 14, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.state === "SCHEDULED" ? "🕒 " : "✅ "}{post.caption}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
