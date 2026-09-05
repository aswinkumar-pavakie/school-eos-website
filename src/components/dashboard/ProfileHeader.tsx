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
            <h1 className="text-[28px] font-bold leading-[34px] text-text">{name}</h1>
            {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
            {pills && pills.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {pills.map((pill, i) => (
                  <span
                    key={i}
                    className={`rounded-[7px] px-2.5 py-1 text-[12px] font-bold ${
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
          {stats.map((stat, i) => (
            <div key={i} className="rounded-[14px] border border-border bg-surface p-4">
              <p className="text-xs font-semibold text-text-muted">{stat.label}</p>
              <p className="mt-1 text-[22px] font-extrabold leading-[26px] text-text">{stat.value}</p>
              {stat.hint && <p className="mt-0.5 text-xs text-text-muted">{stat.hint}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
