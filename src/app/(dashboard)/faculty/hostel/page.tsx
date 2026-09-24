// Hostel -- shown only to a faculty member whose own record says they reside in
// the hostel. Mirrors the mobile Hostel tab, which is an honest placeholder:
// there is no hostel-resident faculty backend yet, so nothing is fabricated.

import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";

export default function FacultyHostelPage() {
  return (
    <div>
      <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-navy)" }}>Hostel</h1>
      <div style={{ marginTop: 24 }}>
        <FacultyEmptyState message="Nothing here yet -- check back soon." />
      </div>
    </div>
  );
}
