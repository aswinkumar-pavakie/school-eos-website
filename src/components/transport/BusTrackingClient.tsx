"use client";

// Real-data-only Bus Tracking view. No map library exists anywhere in this
// repository (checked: no leaflet/mapbox/maplibre/google-maps package or
// import) -- per the product requirement, this does NOT invent one; it shows
// the real latitude/longitude safely (plus a plain "Open in Google Maps" link,
// not an embedded map) and reports the gap explicitly below.

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/dashboard/StatusPill";

interface VehicleOption {
  id: string;
  registrationNo: string;
  model: string | null;
}

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
  lastKnownStop: { stopName: string; recordedAt: string } | null;
  nextStop: { stopName: string } | null;
}

function freshnessTone(freshness: BusTrackingResult["freshness"]): "success" | "pending" | "critical" {
  if (freshness === "LIVE") return "success";
  if (freshness === "STALE") return "pending";
  return "critical";
}

function freshnessLabel(freshness: BusTrackingResult["freshness"]): string {
  if (freshness === "LIVE") return "Tracking";
  if (freshness === "STALE") return "Stale";
  return "No GPS data";
}

/** "12 sec ago" / "4 min ago" / "3 hr ago" / "9 months ago" -- never a fixed
 * unit, since real seed/telemetry data in this environment can be many
 * months old, not just minutes. */
function formatAge(ageSeconds: number): string {
  if (ageSeconds < 60) return `${ageSeconds} sec ago`;
  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function BusTrackingClient({ vehicles }: { vehicles: VehicleOption[] }) {
  const [vehicleId, setVehicleId] = useState("");
  const [result, setResult] = useState<BusTrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No setState here for the "nothing selected" case -- the JSX below only
    // ever reads `result` behind a `vehicleId &&` guard, so a stale result
    // simply never renders once vehicleId is cleared; no reset needed.
    if (!vehicleId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/transport-ops-bus-tracking?vehicleId=${vehicleId}`)
      .then(async (res) => {
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(body?.message ?? "Couldn't load tracking for this bus.");
          setResult(null);
          return;
        }
        setResult(body.data as BusTrackingResult);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load tracking for this bus.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  return (
    <div>
      <label className="flex max-w-xs flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Bus</span>
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">Select a bus</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.registrationNo}
              {v.model ? ` (${v.model})` : ""}
            </option>
          ))}
        </select>
      </label>

      {!vehicleId && (
        <p className="mt-6 rounded-[16px] border border-border bg-surface p-8 text-center text-sm text-text-muted">
          Select a bus to view tracking.
        </p>
      )}

      {vehicleId && loading && (
        <p className="mt-6 text-sm text-text-muted">Loading…</p>
      )}

      {vehicleId && !loading && error && (
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-8 text-center">
          <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this bus</p>
          <p className="mt-1.5 text-sm text-text-muted">{error}</p>
        </div>
      )}

      {vehicleId && !loading && !error && result && (
        <div className="mt-6 flex flex-col gap-6">
          <section className="rounded-[16px] border border-border bg-surface p-[18px]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[19px] font-extrabold leading-[24px] text-text">
                  {result.vehicle.registrationNo}
                  {result.vehicle.model ? ` · ${result.vehicle.model}` : ""}
                </h2>
                <p className="mt-1.5 text-sm text-text-muted">
                  {result.route ? (
                    <>
                      Route: <span className="font-semibold text-text">{result.route.name}</span>
                    </>
                  ) : (
                    "No route currently assigned"
                  )}
                  {result.driver && (
                    <>
                      {" "}
                      · Driver: <span className="font-semibold text-text">{result.driver.fullName}</span>
                    </>
                  )}
                </p>
              </div>
              <StatusPill tone={freshnessTone(result.freshness)} label={freshnessLabel(result.freshness)} />
            </div>
          </section>

          <section className="rounded-[16px] border border-border bg-surface p-[18px]">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Location</h2>
            {result.telemetry ? (
              <div className="mt-3 flex flex-col gap-2 text-sm text-text">
                <p>
                  Coordinates:{" "}
                  <span className="font-mono font-semibold">
                    {result.telemetry.latitude}, {result.telemetry.longitude}
                  </span>{" "}
                  <a
                    href={`https://www.google.com/maps?q=${result.telemetry.latitude},${result.telemetry.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    Open in Google Maps
                  </a>
                </p>
                {result.telemetry.speedKmph !== null && <p>Speed: {result.telemetry.speedKmph} km/h</p>}
                <p className="text-text-muted">Updated {formatAge(result.telemetry.ageSeconds)}</p>
                {/* No map library exists in this codebase yet (checked before building
                    this page) -- coordinates are shown safely above, not plotted. A
                    real map view is a follow-up once a provider is chosen. */}
                <p className="rounded-[11px] bg-field px-3 py-2 text-xs text-text-muted">
                  No map component is wired up yet — showing raw coordinates and a
                  link out to Google Maps instead of an embedded map.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-muted">No location data available for this bus yet.</p>
            )}
          </section>

          <section className="rounded-[16px] border border-border bg-surface p-[18px]">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Today&apos;s trip</h2>
            {result.trip ? (
              <div className="mt-3 flex flex-col gap-2 text-sm text-text">
                <p>
                  {result.trip.direction === "PICKUP" ? "Pickup" : "Drop"} · <StatusPill tone="pending" label={result.trip.state} />
                </p>
                <p>Last known stop: {result.lastKnownStop ? result.lastKnownStop.stopName : "Not available yet"}</p>
                <p>Next stop: {result.nextStop ? result.nextStop.stopName : "Not available yet"}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-muted">No trip available for this bus today.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
