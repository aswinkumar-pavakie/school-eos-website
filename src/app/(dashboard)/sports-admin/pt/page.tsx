// PT / sports periods -- confirmed genuine backend gap (grep of the
// timetable module for a period-type/PT concept returned nothing -- the
// class-timetable schema has no notion of a "PT period" distinct from a
// regular subject period). Honest gap notice.

import { GapNotice } from "@/components/sports-ui/GapNotice";

export default function SportsAdminPtPage() {
  return <GapNotice feature="PT / sports periods" />;
}
