import { KvRows, type KvRow } from "@/components/dashboard/KvRows";

// Shared read-only info card -- pixel-matches TeacherProfileView's own local
// InfoCard (Principal Console.dc.html's teacherPage() mockup), extracted so
// Student/Parent profiles use the exact same card anatomy without touching
// the faculty file. Renders nothing if every row was falsy (e.g. a role that
// doesn't have that field at all), same "honestly omit" rule Teacher's own
// InfoCard follows.

export function ProfileInfoCard({ title, note, rows }: { title: string; note?: string; rows: KvRow[] }) {
  const hasRows = rows.some(Boolean);
  if (!hasRows) return null;
  return (
    <section className="rounded-[16px] border border-border bg-surface p-[18px]">
      <h2 className="text-[15px] font-extrabold leading-[20px] text-text">{title}</h2>
      {note && <p className="mt-1 text-[13px] text-text-muted">{note}</p>}
      <KvRows rows={rows} />
    </section>
  );
}
