import { HostelTabs } from "@/components/hostel/HostelTabs";
import { apiFetch } from "@/lib/api";

export default async function HostelPage() {
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
  const currentYearId = years.find((y: { isCurrent: boolean }) => y.isCurrent)?.id;

  const unallocatedRes = currentYearId
    ? await apiFetch(`/hostel-allocations/unallocated-students?academicYearId=${currentYearId}`)
    : null;
  const unallocatedStudents = unallocatedRes?.ok ? (await unallocatedRes.json()).data : [];

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Hostel</h1>
      <p className="mt-1 text-sm text-text-muted">Structure (hostels, blocks, floors, rooms, beds) and student allocations.</p>

      <HostelTabs hostels={hostels} allocations={allocations} years={years} unallocatedStudents={unallocatedStudents} />
    </div>
  );
}
