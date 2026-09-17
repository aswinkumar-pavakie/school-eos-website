// Authenticated proxy for the Transport Overview navbar's own search bar --
// same reasoning as /api/students-search: the access token lives in an
// httpOnly cookie a client component can't reach directly. Real data across
// buses/routes/drivers -- the SIS Transport mockup's own placeholder says
// "documents" too, but no document has a name/number worth full-text
// searching on its own (a doc is just a type + a vehicle), so a document hit
// surfaces as its owning vehicle instead of a separate result type.
// Deliberately client-filtered here (not a backend `search` query param) --
// these are small real lists (this environment: 5-8 vehicles, 5-8 routes, 6
// drivers), so fetching all three once and filtering in-memory is simpler
// and cheaper than adding search support to three backend endpoints for a
// handful of rows.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

interface SearchResult {
  type: "bus" | "route" | "driver";
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (q.length < 1) {
    return NextResponse.json({ data: [] });
  }

  const [vehiclesRes, routesRes, driversRes] = await Promise.all([
    apiFetch("/vehicles"),
    apiFetch("/routes"),
    apiFetch("/drivers"),
  ]);

  const vehicles: { id: string; registrationNo: string; model: string | null }[] = vehiclesRes.ok
    ? (await vehiclesRes.json()).data
    : [];
  const routes: { id: string; name: string; code: string | null }[] = routesRes.ok ? (await routesRes.json()).data : [];
  const drivers: { id: string; fullName: string; phone: string | null }[] = driversRes.ok ? (await driversRes.json()).data : [];

  const results: SearchResult[] = [
    ...vehicles
      .filter((v) => v.registrationNo.toLowerCase().includes(q) || (v.model ?? "").toLowerCase().includes(q))
      .map((v) => ({
        type: "bus" as const,
        id: v.id,
        label: v.registrationNo,
        sublabel: v.model ?? "Bus",
        href: `/transport-manager/buses/${v.id}`,
      })),
    ...routes
      .filter((r) => r.name.toLowerCase().includes(q) || (r.code ?? "").toLowerCase().includes(q))
      .map((r) => ({
        type: "route" as const,
        id: r.id,
        label: r.name,
        sublabel: "Route",
        href: `/transport-manager/routes`,
      })),
    ...drivers
      .filter((d) => d.fullName.toLowerCase().includes(q))
      .map((d) => ({
        type: "driver" as const,
        id: d.id,
        label: d.fullName,
        sublabel: d.phone ?? "Driver",
        href: `/transport-manager/drivers/${d.id}`,
      })),
  ].slice(0, 8);

  return NextResponse.json({ data: results });
}
