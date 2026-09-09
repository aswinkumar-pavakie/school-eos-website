"use client";

// Live Tracking -- polls the real fleet-tracking endpoint every 15s (safe
// MVP polling, not a new WebSocket/SSE stack -- no realtime infrastructure
// exists in this codebase yet to reuse, matching the product requirement's
// own "safe polling for MVP" instruction). Every bus shown has a real
// telemetry row; a bus with none simply has no map marker and no
// coordinates in its list row -- never a fabricated position.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatRelativeTime } from "@/lib/format";
import type { MapBus } from "@/components/transport/LiveTrackingMap";

const LiveTrackingMap = dynamic(() => import("@/components/transport/LiveTrackingMap").then((m) => m.LiveTrackingMap), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-text-muted">Loading map…</div>,
});

interface BusTrackingResult {
  vehicle: { id: string; registrationNo: string; model: string | null };
  route: { id: string; name: string; code: string | null } | null;
  driver: { id: string; fullName: string } | null;
  telemetry: {
    latitude: string;
    longitude: string;
    speedKmph: string | null;
    heading: number | null;
    recordedAt: string;
    ageSeconds: number;
  } | null;
  freshness: "LIVE" | "STALE" | "NO_DATA";
  trip: { id: string; direction: string; state: string; tripDate: string } | null;
}

const POLL_INTERVAL_MS = 15_000;

function freshnessTone(freshness: BusTrackingResult["freshness"]): "success" | "pending" | "critical" {
  if (freshness === "LIVE") return "success";
  if (freshness === "STALE") return "pending";
  return "critical";
}

function freshnessLabel(freshness: BusTrackingResult["freshness"]): string {
  if (freshness === "LIVE") return "On route";
  if (freshness === "STALE") return "Stale GPS";
  return "No GPS data";
}

export function LiveTrackingClient() {
  const [buses, setBuses] = useState<BusTrackingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/transport-ops-fleet");
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(body?.message ?? "Couldn't load live tracking.");
          return;
        }
        setError(null);
        setBuses(body.data as BusTrackingResult[]);
      } catch {
        if (!cancelled) setError("Couldn't load live tracking.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filtered = buses.filter((b) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return b.vehicle.registrationNo.toLowerCase().includes(q) || (b.route?.name ?? "").toLowerCase().includes(q);
  });

  const mapBuses: MapBus[] = buses
    .filter((b) => b.telemetry)
    .map((b) => ({
      vehicleId: b.vehicle.id,
      registrationNo: b.vehicle.registrationNo,
      routeName: b.route?.name ?? null,
      latitude: Number(b.telemetry!.latitude),
      longitude: Number(b.telemetry!.longitude),
      freshness: b.freshness,
    }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bus or route…"
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        />

        {loading && <p className="text-sm text-text-muted">Loading…</p>}
        {!loading && error && <p className="text-sm text-critical-text">{error}</p>}
        {!loading && !error && filtered.length === 0 && <p className="text-sm text-text-muted">No buses match this search.</p>}

        <ul className="flex max-h-[560px] flex-col gap-2 overflow-y-auto">
          {filtered.map((bus) => (
            <li key={bus.vehicle.id}>
              <button
                type="button"
                onClick={() => setSelectedVehicleId(bus.vehicle.id)}
                className={`w-full rounded-[11px] border p-3 text-left transition-colors ${
                  selectedVehicleId === bus.vehicle.id ? "border-primary bg-field" : "border-border bg-surface hover:bg-field"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-semibold text-text">{bus.vehicle.registrationNo}</p>
                  <StatusPill tone={freshnessTone(bus.freshness)} label={freshnessLabel(bus.freshness)} />
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {bus.route ? bus.route.name : "No route assigned"}
                  {bus.driver ? ` · ${bus.driver.fullName}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {bus.telemetry ? `Updated ${formatRelativeTime(bus.telemetry.recordedAt)}` : "No GPS data yet"}
                  {bus.telemetry?.speedKmph ? ` · ${bus.telemetry.speedKmph} km/h` : ""}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-[560px] overflow-hidden rounded-[16px] border border-border bg-surface">
        <LiveTrackingMap buses={mapBuses} selectedVehicleId={selectedVehicleId} />
      </div>
    </div>
  );
}
