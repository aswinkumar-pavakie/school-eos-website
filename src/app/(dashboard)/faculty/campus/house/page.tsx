// House -- the school's inter-house teams (mobile: Campus > House). Read-only,
// straight from the real house table.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listHouses, type House } from "@/lib/campus-api";
import { Card } from "@/components/faculty-ui/Card";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";

export default async function HousePage() {
  let houses: House[];
  try {
    houses = await listHouses();
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the houses. Nothing was changed -- try again." />;
  }

  return (
    <div>
      <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-navy)" }}>House</h1>
      <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>Inter-house teams</p>

      <div style={{ marginTop: 24 }}>
        {houses.length === 0 ? (
          <FacultyEmptyState message="No houses set up yet." />
        ) : (
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
            {houses.map((h) => (
              <Card key={h.id} padding="20px">
                <div className="flex items-center gap-3.5">
                  <span
                    aria-hidden
                    style={{ width: 44, height: 44, flex: "0 0 44px", borderRadius: "50%", background: h.colourHex ?? "var(--fac-primary)" }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: "700 17px/1.25 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{h.name}</div>
                    <div style={{ font: "500 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 2 }}>{h.status}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
