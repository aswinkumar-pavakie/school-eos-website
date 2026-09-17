// Trials & selection -- confirmed genuine backend gap (grep of
// school-eos-backend/src/modules/sports for "trial" returned nothing; no
// selection-workflow table/service exists). Honest gap notice, not fabricated.

import { GapNotice } from "@/components/sports-ui/GapNotice";

export default function SportsAdminTrialsPage() {
  return <GapNotice feature="Trials & selection" />;
}
