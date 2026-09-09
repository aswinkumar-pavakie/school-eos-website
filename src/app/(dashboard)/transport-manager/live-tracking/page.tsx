import { LiveTrackingClient } from "@/components/transport/LiveTrackingClient";

export default function TransportManagerLiveTrackingPage() {
  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Live Tracking</h1>
      <p className="mt-1 text-sm text-text-muted">
        Every bus with a real GPS ping, refreshed every 15 seconds. A bus with no telemetry yet shows &quot;No GPS data&quot; rather than a guessed position.
      </p>
      <div className="mt-6">
        <LiveTrackingClient />
      </div>
    </div>
  );
}
