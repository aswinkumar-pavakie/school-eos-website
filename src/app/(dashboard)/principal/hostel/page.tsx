// Principal -> Hostel: read-only oversight of the same real hostels,
// structure and student allocations Admin's own Hostel tabs show -- no
// create/allocate/vacate controls. Hostel operational management (structure
// setup, allocation, vacating) stays with Admin; Principal gets visibility.

import { PrincipalHostelTabs } from "@/components/hostel/PrincipalHostelTabs";
import { apiFetch } from "@/lib/api";

export default async function PrincipalHostelPage() {
  const [hostelsRes, allocationsRes, yearsRes] = await Promise.all([
    apiFetch("/hostels"),
    apiFetch("/hostel-allocations"),
    apiFetch("/academic-years"),
  ]);

  if (!hostelsRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Hostel</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: hostels } = await hostelsRes.json();
  const { data: allocations } = allocationsRes.ok ? await allocationsRes.json() : { data: [] };
  const { data: years } = yearsRes.ok ? await yearsRes.json() : { data: [] };

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Hostel</h1>
      <p className="mt-1 text-sm text-text-muted">
        Structure (hostels, blocks, floors, rooms, beds) and student allocations — view-only.
      </p>

      <PrincipalHostelTabs hostels={hostels} allocations={allocations} years={years} />
    </div>
  );
}
