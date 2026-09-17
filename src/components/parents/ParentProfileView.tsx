import type { ReactNode } from "react";
import { BackLink } from "@/components/dashboard/BackLink";
import { ProfileInfoCard } from "@/components/dashboard/ProfileInfoCard";
import { ProfileSection } from "@/components/dashboard/ProfileSection";
import type { KvRow } from "@/components/dashboard/KvRows";

// Shared Parent profile-detail shell -- pixel-matches TeacherProfileView's
// own anatomy (Principal Console.dc.html's teacherPage() mockup) and
// StudentProfileView's own copy of that same grammar: one identity card
// (photo, name, subtitle line, pill chips, stat tiles), an InfoCard grid of
// short read-only summaries, then a stack of full-width bordered sections.
// This component only owns layout -- every value is passed in already real
// and already fetched by the caller.

export interface ParentProfilePill {
  label: string;
  tone?: "primary" | "success" | "critical" | "pending" | "neutral";
}

export interface ParentProfileStat {
  label: string;
  value: string;
  hint?: string;
}

export interface ParentProfileInfoCard {
  title: string;
  note?: string;
  rows: KvRow[];
}

export interface ParentProfileSection {
  key: string;
  title: string;
  subtitle?: ReactNode;
  headerExtra?: ReactNode;
  content: ReactNode;
}

const PILL_TONE_CLASSES: Record<NonNullable<ParentProfilePill["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success-bg text-success-text",
  critical: "bg-critical-bg text-critical-text",
  pending: "bg-pending-bg text-pending-text",
  neutral: "bg-field text-text-muted",
};

export function ParentProfileView({
  backHref,
  backLabel = "Back to parents",
  photo,
  name,
  subtitle,
  pills,
  stats,
  headerActions,
  belowHeaderActions,
  infoCards,
  sections,
}: {
  backHref: string;
  backLabel?: string;
  photo: ReactNode;
  name: string;
  subtitle?: string;
  pills: ParentProfilePill[];
  stats: ParentProfileStat[];
  headerActions?: ReactNode;
  belowHeaderActions?: ReactNode;
  infoCards: ParentProfileInfoCard[];
  /** Remaining full-width sections in display order (Login & security, Linked children, Account, ...). */
  sections: ParentProfileSection[];
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
