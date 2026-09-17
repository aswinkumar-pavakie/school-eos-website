import type { ReactNode } from "react";

// Shared bordered full-width section shell for profile-detail pages (Student,
// Parent) -- pixel-matches TeacherProfileView's own Roles/Timetable/
// extraSections cards (Principal Console.dc.html's teacherPage() mockup):
// rounded-[16px] border-border bg-surface p-[18px], 15px/800 heading. One
// place for the card anatomy so Student/Parent profiles never drift from
// Faculty's own equivalent sections.

export function ProfileSection({
  title,
  subtitle,
  headerExtra,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  /** e.g. Admin's "Assign / change" link next to a heading. */
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">{title}</h2>
        {headerExtra}
      </div>
      {subtitle && <p className="mt-1 text-[13px] text-text-muted">{subtitle}</p>}
      {children}
    </section>
  );
}
