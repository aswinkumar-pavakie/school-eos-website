// Not built yet for Principal. Update: a real Examinations backend now exists
// (src/modules/examinations) covering `exam` + `exam_subject` specifically --
// list/create/update exams, manage the per-subject schedule, publish, lock.
// It's Admin-only end to end (admin/examinations, admin/examination-timetable)
// by explicit instruction; this Principal page was deliberately not wired to
// it in that pass. The wider Phase 3 doc block this note used to describe in
// full (Assessment Types, Assessments, Assessment Marks, Grade Scales, Report
// Cards -- 38 APIs total) is still true and still unbuilt: `grade_scale` has
// its own CRUD already (Academic module), but `assessment_*`, marks entry, and
// `report_card*` remain a separate, much larger future build, not part of
// what exists today. Per the approved doc, "Academic authority" (which
// includes creating/publishing/locking examinations) resolves to Admin,
// Principal, and Vice Principal -- so a genuine Principal view of Examinations
// (not merely read-only oversight, per that doc language) is a well-grounded
// future phase once it's actually scoped and built, which hasn't happened yet.

import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      title="Examinations"
      note="Admin now manages examinations directly (create, schedule, publish, lock). A Principal view of it hasn't been built yet -- that's a separate phase. Marks entry, assessments, and report cards are a separate, larger future build."
    />
  );
}
