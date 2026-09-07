// Not built yet -- same honest reasoning as Admin's own examinations stub
// (src/app/(dashboard)/admin/examinations/page.tsx) and this Principal login's
// own examination-timetable stub. Confirmed by inspecting the backend
// (src/modules) and the approved API documentation
// (brain/school-eos-api-documentation-FINAL-v4.md, "Phase 3 - Assessment,
// Examination & Report Cards", 38 undelivered APIs) that:
//   - No exam/mark/report-card controller or service exists anywhere yet --
//     the `exam`, `exam_subject`, `exam_grade`, `mark`, `mark_correction`,
//     `grade_scale` and `report_card` tables are provisioned in the DB but
//     nothing reads or writes them.
//   - The generic `assessment`/`assessment_type`/`assessment_subject` tables
//     the approved design also calls for don't exist in the schema at all --
//     this feature has not been started at the schema level, let alone built.
//   - This is documented as a large, separate, not-yet-built feature phase,
//     not a small Principal-oversight extension of something Admin already has.
// Per the approved docs, "Academic authority" for creating/publishing/locking
// examinations "now resolves only to Admin, Principal, and Vice Principal" --
// so when this module is actually built, Principal is a genuine co-equal
// operational authority here, not merely a read-only observer. But inventing
// that entire 38-endpoint feature now, under a Principal-only phase, before it
// exists for anyone (Admin/VP included), would be building new functionality
// from scratch rather than reusing an existing backend -- exactly what this
// phase's own instructions rule out.

import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      title="Examinations"
      note="This will be built once the Assessment, Examination & Report Cards backend exists. Per the approved design, Principal (alongside Admin and Vice Principal) is a co-equal Academic Authority for examination setup and publishing -- not a separate, view-only role."
    />
  );
}
