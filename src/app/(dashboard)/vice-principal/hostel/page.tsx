// VicePrincipal -> Hostel: read-only oversight of the same real hostels,
// structure and student allocations Admin's own Hostel tabs show -- no
// create/allocate/vacate controls. Hostel operational management (structure
// setup, allocation, vacating) stays with Admin; VicePrincipal gets visibility.
//
// Pixel-matched against Principal Console.dc.html's own hostelPage() (line
// ~1771-1814) via the shared HostelOverview component -- see its own top
// comment for exactly which mockup fields are real vs. honestly not tracked.

import { HostelOverview, type HostelBlockOversight, type HostelComplaintEntry, type HostelOutingEntry, type HostelRosterEntry } from "@/components/hostel/HostelOverview";
import { PrincipalHostelTabs } from "@/components/hostel/PrincipalHostelTabs";
import { apiFetch } from "@/lib/api";

export default async function VicePrincipalHostelPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [hostelsRes, allocationsRes, activeAllocationsRes, yearsRes, rosterRes, blocksRes, outingsRes, decisionsRes, complaintsRes] =
    await Promise.all([
      apiFetch("/hostels"),
      apiFetch("/hostel-allocations"),
      apiFetch("/hostel-allocations?status=ACTIVE"),
      apiFetch("/academic-years"),
      apiFetch(`/hostel/night-attendance/oversight?date=${today}`),
      apiFetch("/hostel-blocks-oversight"),
      apiFetch("/hostel/outings/oversight"),
      apiFetch("/hostel/outings/recent-decisions"),
      apiFetch("/hostel/complaints/oversight"),
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
  const { data: activeAllocations } = activeAllocationsRes.ok ? await activeAllocationsRes.json() : { data: [] };
  const { data: years } = yearsRes.ok ? await yearsRes.json() : { data: [] };
  const roster: HostelRosterEntry[] = rosterRes.ok ? ((await rosterRes.json()) as { data: HostelRosterEntry[] }).data : [];
  const blocks: HostelBlockOversight[] = blocksRes.ok ? ((await blocksRes.json()) as { data: HostelBlockOversight[] }).data : [];
  const activeOutings: HostelOutingEntry[] = outingsRes.ok ? ((await outingsRes.json()) as { data: HostelOutingEntry[] }).data : [];
  const recentDecisions: HostelOutingEntry[] = decisionsRes.ok
    ? ((await decisionsRes.json()) as { data: HostelOutingEntry[] }).data
    : [];
  const complaints: HostelComplaintEntry[] = complaintsRes.ok
    ? ((await complaintsRes.json()) as { data: HostelComplaintEntry[] }).data
    : [];

  return (
    <div>
      <HostelOverview
        allocationsOnRoll={activeAllocations.length}
        roster={roster}
        rollCallDate={today}
        blocks={blocks}
        activeOutings={activeOutings}
        recentDecisions={recentDecisions}
        complaints={complaints}
      />

      <div className="mx-auto mt-8 max-w-[1180px]">
        <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">Structure &amp; allocations</h2>
        <p className="mt-1 text-[13px] text-text-muted">Hostels, blocks, floors, rooms, beds and student allocations — view-only.</p>
        <div className="mt-4">
          <PrincipalHostelTabs hostels={hostels} allocations={allocations} years={years} basePath="/vice-principal" />
        </div>
      </div>
    </div>
  );
}
