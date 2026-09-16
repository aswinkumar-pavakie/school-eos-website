import type { ReactNode } from "react";

// Shared profile-header layout for Student/Faculty/Parent profiles: photo on
// the left, name + subtitle + a row of pills, an optional row of stat cards
// below, and an actions slot (buttons/dialogs) on the right of the name row.
// Every value passed in must be real -- this is layout only, no data of its own.

export interface ProfilePill {
  label: string;
  tone?: "primary" | "success" | "critical" | "pending" | "neutral";
}

export interface ProfileStat {
  label: string;
  value: string;
  hint?: string;
}

const PILL_TONE_CLASSES: Record<NonNullable<ProfilePill["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success-bg text-success-text",
  critical: "bg-critical-bg text-critical-text",
  pending: "bg-pending-bg text-pending-text",
  neutral: "bg-field text-text-muted",
};

export function ProfileHeader({
  photo,
  name,
  subtitle,
  pills,
  stats,
  actions,
  belowActions,
}: {
  photo: ReactNode;
  name: string;
  subtitle?: string;
  pills?: ProfilePill[];
  stats?: ProfileStat[];
  actions?: ReactNode;
  /** Rendered in its own row directly under the actions row (e.g. under
   * "Print ID card") and above the stats grid (e.g. above the Fees stat). */
  belowActions?: ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {photo}
          <div>
            {/* 40px/700/-0.03em/1.05, checked against Principal Console.dc.html's
                own isHero markup (sec.name) -- not the generic page-h1 size. */}
            <h1 className="text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-text">{name}</h1>
            {subtitle && <p className="mt-1.5 text-base text-text-muted">{subtitle}</p>}
            {pills && pills.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                {pills.map((pill, i) => (
                  <span
                    key={i}
                    className={`rounded-[var(--radius-pill)] px-3.5 py-2 text-[13px] font-semibold ${
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
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {belowActions && <div className="mt-3 flex justify-end">{belowActions}</div>}

      {stats && stats.length > 0 && (
        <div
          className="mt-5 grid gap-3"
          style={{ gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))` }}
        >
          {/* Filled tile (not bordered card), 12px radius, per isHero's own
              tile markup (Principal Console.dc.html line 325). */}
          {stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-[12px] p-4"
              style={{ background: "var(--color-tile-bg, var(--color-field))" }}
            >
              <p className="text-[13px] text-text-muted">{stat.label}</p>
              <p className="mt-1.5 text-[26px] font-bold leading-none tracking-[-0.02em] text-text">{stat.value}</p>
              {stat.hint && (
                <p className="mt-1.5 text-xs" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                  {stat.hint}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
