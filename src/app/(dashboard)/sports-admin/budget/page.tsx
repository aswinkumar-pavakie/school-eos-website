// Budget & approvals -- confirmed genuine backend gap (grep of
// school-eos-backend/src/modules/sports for "budget" returned nothing; no
// sports-specific budget allocation/tracking table exists -- Finance's own
// generic budget module is a school-wide ledger, not sport-scoped, so
// reusing it here would misrepresent department-level figures). Honest gap.

import { GapNotice } from "@/components/sports-ui/GapNotice";

export default function SportsAdminBudgetPage() {
  return <GapNotice feature="Budget & approvals" />;
}
