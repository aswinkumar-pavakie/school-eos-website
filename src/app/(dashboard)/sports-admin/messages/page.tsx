// Messages -- confirmed genuine backend gap for THIS role specifically: the
// real E2EE messaging module (school-eos-backend/src/modules/messaging)
// exists and works, but every route is @Roles('FACULTY', 'PARENT',
// 'PRINCIPAL') only -- SPORTS_ADMIN has no conversations to read because it
// isn't a participant type the module's own conversation-repository logic
// resolves against (no notion of "which parents does a school-wide sports
// role message"). Broadening this correctly needs real product/schema
// decisions (who exactly can a Sports Admin message, and about what) that
// weren't part of this build -- so this stays an honest gap rather than a
// guessed-at broaden. See the layout's own odCount/indentsCount wiring next
// to this same note.

import { GapNotice } from "@/components/sports-ui/GapNotice";

export default function SportsAdminMessagesPage() {
  return <GapNotice feature="Messages" />;
}
