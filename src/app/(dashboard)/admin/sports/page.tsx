// Sports -- Design Architecture v0.1 module 17 (Admin's slice: structure, not
// operations -- "Sports is deliberately split into structure vs operations. Admin
// builds Sport -> Category -> Facility -> Equipment -> Coach"). One page, tabbed
// across Sports+Categories, Equipment, Coaches. Every value is real data via apiFetch.

import type { SportCategory } from "@/components/sports/SportsPanel";
import { SportsTabs } from "@/components/sports/SportsTabs";
import { apiFetch } from "@/lib/api";

export default async function SportsPage() {
  const [sportsRes, equipmentRes, coachesRes, overviewRes] = await Promise.all([
    apiFetch("/sports"),
    apiFetch("/equipment"),
    apiFetch("/coaches"),
    apiFetch("/sports/overview"),
  ]);

  if (!sportsRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Sports</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: sports } = await sportsRes.json();
  const { data: equipment } = equipmentRes.ok ? await equipmentRes.json() : { data: [] };
  const { data: coaches } = coachesRes.ok ? await coachesRes.json() : { data: [] };
  const { data: overview } = overviewRes.ok ? await overviewRes.json() : { data: null };

  // Small N+1 (one call per sport) -- acceptable at this scale (a handful of
  // sports), and each sport's categories aren't available from the top-level list.
  const categoryResults = await Promise.all(
    sports.map((s: { id: string }) => apiFetch(`/sports/${s.id}/categories`)),
  );
  const categoriesBySport: Record<string, SportCategory[]> = {};
  for (let i = 0; i < sports.length; i++) {
    categoriesBySport[sports[i].id] = categoryResults[i].ok ? (await categoryResults[i].json()).data : [];
  }

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Sports</h1>
      <p className="mt-1 text-sm text-text-muted">
        Sports, categories, equipment and coach registration are managed here. Teams, training, tournaments,
        results, achievements, OD requests and equipment issue/return are Faculty (Sports In-Charge) operations run
        from mobile — the Oversight tab shows them read-only.
      </p>
      <div className="mt-6">
        <SportsTabs
          sports={sports}
          categoriesBySport={categoriesBySport}
          equipment={equipment}
          coaches={coaches}
          overview={overview}
        />
      </div>
    </div>
  );
}
