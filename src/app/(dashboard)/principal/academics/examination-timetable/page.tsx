// Not built yet -- same honest reasoning as Admin's own examination-timetable
// stub (src/app/(dashboard)/admin/examination-timetable/page.tsx). Principal's
// login now exists, but there is still no exam/examination-timetable backend
// at all (no controller, no approval_policy row), and Academic Coordinator --
// the role that would create/submit one -- is mobile-only with no built
// submission workflow yet. Inventing a fake Approve/Reject/Send Back UI over
// data that doesn't exist would violate this phase's own explicit instruction
// not to invent approval behavior absent from the approved workflow.

import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      title="Examination Timetable"
      note="This will be built once the Academic Coordinator's examination-timetable-creation workflow exists. Principal's own review/approve step will reuse the same generic approvals engine already used for Purchase Requests and other decisions."
    />
  );
}
