"use client";

// Client half of the shared Faculty/Parent video-call page -- camera/mic
// access and the LiveKit connection both need client-side code. Fetches its
// own join token on mount via requestCallTokenAction (server-side role
// detection + the real backend authorization check), then hands off to
// LiveKit's own prebuilt <VideoConference> (mute/camera/leave/participant
// grid, chat panel) rather than hand-rolling call controls -- this is a
// brand-new feature for this app with no existing call-UI precedent to
// match, so the officially maintained prebuilt is the right default; can be
// restyled to this app's own design tokens later if it looks too generic.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { requestCallTokenAction } from "./actions";

interface Credentials {
  url: string;
  token: string;
}

export function CallRoom({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    requestCallTokenAction(bookingId)
      .then((creds) => {
        if (!cancelled) setCredentials(creds);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not join the call.");
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  function leave() {
    router.back();
  }

  if (error) {
    return (
      <div style={styles.center}>
        <p style={styles.errorText}>{error}</p>
        <button style={styles.leaveButton} onClick={leave}>
          Go back
        </button>
      </div>
    );
  }

  if (!credentials) {
    return (
      <div style={styles.center}>
        <p style={styles.loadingText}>Connecting…</p>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <LiveKitRoom
        serverUrl={credentials.url}
        token={credentials.token}
        connect
        audio
        video
        onDisconnected={leave}
        style={{ height: "100vh" }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}

const styles = {
  wrap: { height: "100vh", background: "#0F1B33" },
  center: {
    height: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: "#0F1B33",
    color: "#fff",
  },
  loadingText: { fontSize: 14, fontWeight: 600 },
  errorText: { fontSize: 14, fontWeight: 600, textAlign: "center" as const, maxWidth: 320 },
  leaveButton: {
    marginTop: 8,
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
    background: "var(--color-primary, #2563EB)",
    border: "none",
    cursor: "pointer",
  },
};
