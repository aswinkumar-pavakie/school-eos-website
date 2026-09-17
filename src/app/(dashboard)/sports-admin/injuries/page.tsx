// Injuries & incidents -- confirmed genuine backend gap (grep of
// school-eos-backend/src/modules/sports for "injur" returned nothing; no
// injury/incident table exists in this schema). Honest gap notice.

import { GapNotice } from "@/components/sports-ui/GapNotice";

export default function SportsAdminInjuriesPage() {
  return <GapNotice feature="Injuries & incidents" />;
}
