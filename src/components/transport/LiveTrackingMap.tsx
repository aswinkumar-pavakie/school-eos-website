"use client";

// Plain Leaflet (not react-leaflet) mounted imperatively into a ref'd div --
// sidesteps react-leaflet's own React-version pinning entirely, and is the
// standard way to use Leaflet inside Next.js App Router client components.
// OpenStreetMap tiles: free, no API key. Buses are plotted as circleMarkers
// (color = real freshness), not Leaflet's default pin icon -- that sidesteps
// a well-known bundler asset-path issue with Leaflet's default marker images
// entirely, rather than working around it.

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export interface MapBus {
  vehicleId: string;
  registrationNo: string;
  routeName: string | null;
  latitude: number;
  longitude: number;
  freshness: "LIVE" | "STALE" | "NO_DATA";
}

const FRESHNESS_COLOR: Record<MapBus["freshness"], string> = {
  LIVE: "#1e8a4c",
  STALE: "#b8860b",
  NO_DATA: "#8a8f98",
};

export function LiveTrackingMap({ buses, selectedVehicleId }: { buses: MapBus[]; selectedVehicleId: string | null }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").CircleMarker>>(new Map());

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current).setView([11.0168, 76.9558], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      const map = mapRef.current;
      if (cancelled || !map) return;

      const seen = new Set<string>();
      for (const bus of buses) {
        seen.add(bus.vehicleId);
        const existing = markersRef.current.get(bus.vehicleId);
        const popupHtml = `<strong>${bus.registrationNo}</strong>${bus.routeName ? `<br/>${bus.routeName}` : ""}`;
        if (existing) {
          existing.setLatLng([bus.latitude, bus.longitude]);
          existing.setStyle({ color: FRESHNESS_COLOR[bus.freshness], fillColor: FRESHNESS_COLOR[bus.freshness] });
          existing.setPopupContent(popupHtml);
        } else {
          const marker = L.circleMarker([bus.latitude, bus.longitude], {
            radius: 9,
            color: FRESHNESS_COLOR[bus.freshness],
            fillColor: FRESHNESS_COLOR[bus.freshness],
            fillOpacity: 0.85,
            weight: 2,
          })
            .addTo(map)
            .bindPopup(popupHtml);
          markersRef.current.set(bus.vehicleId, marker);
        }
      }
      for (const [vehicleId, marker] of markersRef.current) {
        if (!seen.has(vehicleId)) {
          marker.remove();
          markersRef.current.delete(vehicleId);
        }
      }

      if (buses.length > 0) {
        const bounds = L.latLngBounds(buses.map((b) => [b.latitude, b.longitude] as [number, number]));
        map.fitBounds(bounds.pad(0.2));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [buses]);

  useEffect(() => {
    if (!selectedVehicleId) return;
    const marker = markersRef.current.get(selectedVehicleId);
    if (marker) {
      mapRef.current?.setView(marker.getLatLng(), 15);
      marker.openPopup();
    }
  }, [selectedVehicleId]);

  return <div ref={containerRef} className="h-full w-full rounded-[16px]" />;
}
