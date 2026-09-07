// Not built yet for Principal. The backend now exists
// (src/modules/examinations, exam + exam_subject -- real, already-populated
// tables) with a real Admin-only frontend at admin/examinations and
// admin/examination-timetable, built by explicit instruction to scope that
// build to Admin only. The approved API doc calls this "Academic authority",
// which it resolves to Admin, Principal, and Vice Principal -- so a
// Principal-facing view (read-only, matching every other Principal module's
// oversight pattern) is a real, well-grounded next phase, just not done yet.
// Note: the previous version of this note assumed Academic Coordinator would
// eventually submit a schedule for review -- that's wrong. The doc is explicit
// that Academic Coordinator never gets a web login at all (Faculty
// assignment, mobile-only, "no Faculty account -- regardless of assignment,
// including Academic Coordinator -- can authenticate against a web-tagged
// endpoint"), so there is no submission workflow to wait on; Admin creates and
// manages exams directly.

import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      title="Examination Timetable"
      note="Admin now manages the examination timetable directly (Examinations module). A read-only Principal view of it hasn't been built yet -- that's a separate phase."
    />
  );
}
