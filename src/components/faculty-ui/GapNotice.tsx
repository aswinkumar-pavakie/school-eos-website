import { ErrorState } from "@/components/ui/EmptyState";

// The one shared "known backend gap" degrade path (see the plan's "Known
// gaps" section) -- used by Reports, Students roster/detail, Fees, Profile,
// and the Performance-remarks / Entry-marks-verify / Academic-Calendar-
// personal-events partial gaps. Deliberately reuses the plain SITEWIDE
// ErrorState (not the pixel-perfect FacultyEmptyState) so an unavailable
// backend stays visually distinguishable from a genuine empty result -- never
// silently indistinguishable, never fake/mock data.
export function GapNotice({ feature }: { feature: string }) {
  return (
    <ErrorState
      message={`${feature} isn't available to your account yet -- this screen is fully built and will work as soon as backend access is granted. Nothing here is fake data.`}
    />
  );
}
