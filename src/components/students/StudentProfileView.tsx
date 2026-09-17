import type { ReactNode } from "react";
import { BackLink } from "@/components/dashboard/BackLink";
import { ProfileInfoCard } from "@/components/dashboard/ProfileInfoCard";
import { ProfileSection } from "@/components/dashboard/ProfileSection";
import type { KvRow } from "@/components/dashboard/KvRows";

// Shared Student profile-detail shell -- pixel-matches TeacherProfileView's
// own anatomy (Principal Console.dc.html's teacherPage() mockup) so Admin/
// Principal/Vice Principal's Student profile uses the exact same card
// grammar as Faculty's own profile view: one identity card (photo, name,
// subtitle line, pill chips, then a 2/4-tile stats row), an InfoCard grid of
// short read-only summaries, then a stack of full-width bordered sections.
// This component only owns layout -- every value is passed in already real
// and already fetched by the caller; a role simply omits an infoCard/section
// it isn't authorized for or doesn't have real data for.

export interface StudentProfilePill {
  label: string;
  tone?: "primary" | "success" | "critical" | "pending" | "neutral";
}

export interface StudentProfileStat {
  label: string;
  value: string;
  hint?: string;
}

export interface StudentProfileInfoCard {
  title: string;
  note?: string;
  rows: KvRow[];
}

export interface StudentProfileSection {
  key: string;
  title: string;
  subtitle?: ReactNode;
  headerExtra?: ReactNode;
  content: ReactNode;
}

const PILL_TONE_CLASSES: Record<NonNullable<StudentProfilePill["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success-bg text-success-text",
  critical: "bg-critical-bg text-critical-text",
  pending: "bg-pending-bg text-pending-text",
  neutral: "bg-field text-text-muted",
};

export function StudentProfileView({
  backHref,
  backLabel = "Back to students",
  photo,
  name,
  subtitle,
  pills,
  stats,
  headerActions,
  belowHeaderActions,
  leavingNote,
  infoCards,
  sections,
}: {
  backHref: string;
  backLabel?: string;
  photo: ReactNode;
  name: string;
  subtitle?: string;
  pills: StudentProfilePill[];
  stats: StudentProfileStat[];
  /** Role-specific header actions (e.g. Admin's "Print ID card" / leave-student dialog). Absent for read-only roles. */
  headerActions?: ReactNode;
  /** The HeaderButtonSlot portal target for an editable form's own Save button (Admin only). */
  belowHeaderActions?: ReactNode;
  /** e.g. "Left on 12 Jan 2026." banner, already built by the page from real status. */
  leavingNote?: ReactNode;
  /** Short read-only summary cards (Profile / Contact / Academic details) in a 3-col grid -- a role omits a card, or a row within one, it has no real data for. */
  infoCards: StudentProfileInfoCard[];
  /** Remaining full-width sections in display order (Enrolment history, Fees, Wallet, Transport, Guardians, Certificates, an Admin-only edit form, ...). */
  sections: StudentProfileSection[];
}) {
  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-4 mt-2 flex flex-wrap items-center justify-between gap-3">
        <BackLink href={backHref} label={backLabel} />
        {(headerActions || belowHeaderActions) && (
          <div className="flex items-center gap-2">
            {headerActions}
            {belowHeaderActions}
          </div>
        )}
      </div>

      {/* Identity card -- isHero per Principal Console.dc.html's teacherPage():
          photo, name, subtitle line, pill chips, then the stat tiles row, all
          on one bordered card. */}
      <section className="rounded-[16px] border border-border bg-surface p-[22px]">
        <div className="flex flex-wrap items-start gap-5">
          {photo}
          <div className="min-w-0 flex-1">
            <h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-text">{name}</h1>
            {subtitle && <p className="mt-1.5 text-[15px] text-text-muted">{subtitle}</p>}
            {pills.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {pills.map((pill, i) => (
                  <span
                    key={i}
                    className={`rounded-[var(--radius-pill)] px-3.5 py-1.5 text-[13px] font-semibold ${
                      PILL_TONE_CLASSES[pill.tone ?? "neutral"]
                    }`}
                  >
                    {pill.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={i} className="rounded-[12px] bg-field p-4">
                <p className="text-[13px] text-text-muted">{stat.label}</p>
                <p className="mt-1.5 text-[22px] font-bold leading-none tracking-[-0.02em] text-text">{stat.value}</p>
                {stat.hint && <p className="mt-1.5 text-xs text-text-muted">{stat.hint}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {leavingNote}

      {infoCards.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {infoCards.map((card, i) => (
            <ProfileInfoCard key={i} title={card.title} note={card.note} rows={card.rows} />
          ))}
        </div>
      )}

      {sections.map((section) => (
        <ProfileSection key={section.key} title={section.title} subtitle={section.subtitle} headerExtra={section.headerExtra}>
          {section.content}
        </ProfileSection>
      ))}
    </div>
  );
}
