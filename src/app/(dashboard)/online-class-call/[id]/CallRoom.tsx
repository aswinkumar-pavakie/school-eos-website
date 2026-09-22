"use client";

// Online Class -- in-app LiveKit call screen, pixel-matched to the approved
// design (dark video stage, pill overlays, bottom control bar, slide-up
// panels for Share/Students/Chat). Shared by Faculty and Parent -- `role`
// decides which controls render, never a separate component tree, so the
// call surface itself (video grid, self-view, panels) stays provably
// identical for both sides.
//
// Screen share and raise-hand are real (LiveKit's own setScreenShareEnabled
// and a self-updated "handRaised" participant attribute, synced to everyone
// automatically -- no backend round-trip). Whiteboard, document share and
// quick polls are NOT built yet (Phase 2, per the approved plan) -- their
// buttons are visible but clearly marked "Coming soon" rather than silently
// doing nothing, so nobody mistakes them for broken.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  useChat,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
  VideoTrack,
  isTrackReference,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, type Participant } from "livekit-client";
import {
  endOnlineClassCallAction,
  muteOnlineClassParticipantAction,
  requestOnlineClassCallTokenAction,
} from "./actions";

type Role = "faculty" | "parent";
type Panel = null | "share" | "students" | "chat";

interface Credentials {
  url: string;
  token: string;
  roomName: string;
}

export function CallRoom({ classId, role }: { classId: string; role: Role }) {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    requestOnlineClassCallTokenAction(classId)
      .then((creds) => {
        if (!cancelled) setCredentials(creds);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not join this class.");
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  function backToList() {
    router.push(role === "faculty" ? "/faculty/online-class" : "/parent/online-class");
  }

  if (error) {
    return (
      <div style={s.center}>
        <p style={s.errorText}>{error}</p>
        <button type="button" style={s.leaveButton} onClick={backToList}>
          Go back
        </button>
      </div>
    );
  }

  if (!credentials) {
    return (
      <div style={s.center}>
        <p style={s.loadingText}>Connecting…</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={credentials.url}
      token={credentials.token}
      connect
      audio
      video
      onDisconnected={backToList}
    >
      <CallStage classId={classId} role={role} onLeave={backToList} />
    </LiveKitRoom>
  );
}

function CallStage({ classId, role, onLeave }: { classId: string; role: Role; onLeave: () => void }) {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const participants = useParticipants();
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const { chatMessages, send: sendChat } = useChat();

  const [panel, setPanel] = useState<Panel>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [ending, setEnding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startedAt = Date.now();
    const interval = setInterval(() => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  const raisedCount = useMemo(
    () => participants.filter((p) => p.attributes?.handRaised === "true").length,
    [participants],
  );

  const activeScreenShare = screenTracks[0];
  const spotlightCamera =
    cameraTracks.find((t) => t.participant.identity !== localParticipant.identity) ?? cameraTracks[0];

  function toggleMic() {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled).catch(() => undefined);
  }
  function toggleCamera() {
    localParticipant.setCameraEnabled(!isCameraEnabled).catch(() => undefined);
  }
  function toggleScreenShare() {
    localParticipant.setScreenShareEnabled(!isScreenShareEnabled).catch(() => undefined);
  }
  function toggleHandRaise() {
    const next = !handRaised;
    setHandRaised(next);
    localParticipant.setAttributes({ handRaised: next ? "true" : "false" }).catch(() => undefined);
  }
  function toggleFullscreen() {
    if (!stageRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      stageRef.current.requestFullscreen().catch(() => undefined);
    }
  }

  async function handleEnd() {
    setEnding(true);
    try {
      await endOnlineClassCallAction(classId);
    } catch {
      // Even if the state-transition call fails, still leave the room -- never trap
      // the faculty on a call screen they explicitly asked to end.
    }
    onLeave();
  }

  async function handleMute(identity: string, muted: boolean) {
    try {
      await muteOnlineClassParticipantAction(classId, identity, muted);
    } catch {
      setToast("Couldn't update that participant's mic. Try again.");
      setTimeout(() => setToast(null), 2500);
    }
  }

  const meCard = localParticipant.name ?? "You";
  const initials = meCard
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={stageRef} style={s.stage}>
      {/* Main video area */}
      <div style={s.videoArea}>
        {activeScreenShare && isTrackReference(activeScreenShare) ? (
          <VideoTrack trackRef={activeScreenShare} style={s.video} />
        ) : spotlightCamera && isTrackReference(spotlightCamera) ? (
          <VideoTrack trackRef={spotlightCamera} style={s.video} />
        ) : (
          <div style={s.heroCard}>
            <div style={s.avatarCircle}>{initials}</div>
            <div style={s.heroName}>{meCard}</div>
            <div style={s.heroSubtitle}>
              {role === "faculty" ? "You are presenting" : "Waiting for the teacher to share video"}
            </div>
          </div>
        )}

        {/* Top-left: live timer */}
        <div style={{ ...s.pill, ...s.pillTopLeft }}>
          <span style={s.liveDot} />
          {formatElapsed(elapsedSec)}
        </div>

        {/* Top-right: fullscreen / roster count / raised-hand count */}
        <div style={s.pillGroupTopRight}>
          <button type="button" style={s.pill} onClick={toggleFullscreen}>
            ⛶ Full screen
          </button>
          <button type="button" style={s.pill} onClick={() => setPanel("students")}>
            {participants.length} in class
          </button>
          {raisedCount > 0 && (
            <button type="button" style={{ ...s.pill, ...s.pillAmber }} onClick={() => setPanel("students")}>
              {raisedCount} raised
            </button>
          )}
        </div>

        {/* Self-view PiP */}
        <div style={s.pip}>
          {isCameraEnabled ? (
            (() => {
              const own = cameraTracks.find((t) => t.participant.identity === localParticipant.identity);
              return own && isTrackReference(own) ? (
                <VideoTrack trackRef={own} style={{ ...s.video, transform: "scaleX(-1)" }} />
              ) : (
                <span style={s.pipLabel}>Camera off</span>
              );
            })()
          ) : (
            <span style={s.pipLabel}>Camera off</span>
          )}
        </div>

        {toast && <div style={s.toast}>{toast}</div>}

        {/* Panels */}
        {panel === "share" && (
          <SharePanel
            onClose={() => setPanel(null)}
            screenShareOn={isScreenShareEnabled}
            onToggleScreenShare={toggleScreenShare}
          />
        )}
        {panel === "students" && (
          <StudentsPanel
            onClose={() => setPanel(null)}
            participants={participants}
            localIdentity={localParticipant.identity}
            canModerate={role === "faculty"}
            onMute={handleMute}
          />
        )}
        {panel === "chat" && (
          <ChatPanel onClose={() => setPanel(null)} messages={chatMessages} onSend={sendChat} />
        )}
      </div>

      {/* Bottom control bar */}
      <div style={s.controlBar}>
        <ControlButton
          active={!isMicrophoneEnabled}
          activeStyle="danger"
          icon={isMicrophoneEnabled ? <MicIcon /> : <MicOffIcon />}
          label={isMicrophoneEnabled ? "Mute" : "Unmute"}
          onClick={toggleMic}
        />
        <ControlButton
          active={!isCameraEnabled}
          activeStyle="danger"
          icon={isCameraEnabled ? <CameraIcon /> : <CameraOffIcon />}
          label={isCameraEnabled ? "Camera off" : "Camera on"}
          onClick={toggleCamera}
        />
        <ControlButton
          active={panel === "share" || isScreenShareEnabled}
          activeStyle="primary"
          icon={<ShareIcon />}
          label="Share"
          onClick={() => setPanel(panel === "share" ? null : "share")}
        />
        {role === "faculty" ? (
          <ControlButton
            active={panel === "students"}
            icon={<PeopleIcon />}
            label="Students"
            onClick={() => setPanel(panel === "students" ? null : "students")}
          />
        ) : (
          <ControlButton
            active={handRaised}
            activeStyle="amber"
            icon={<HandIcon />}
            label={handRaised ? "Lower hand" : "Raise hand"}
            onClick={toggleHandRaise}
          />
        )}
        <ControlButton
          active={panel === "chat"}
          icon={<ChatIcon />}
          label="Chat"
          onClick={() => setPanel(panel === "chat" ? null : "chat")}
        />
        {role === "faculty" ? (
          <ControlButton
            activeStyle="danger"
            active
            icon={<EndIcon />}
            label={ending ? "Ending…" : "End"}
            onClick={handleEnd}
          />
        ) : (
          <ControlButton
            activeStyle="danger"
            active
            icon={<EndIcon />}
            label="Leave"
            onClick={() => room.disconnect()}
          />
        )}
      </div>
    </div>
  );
}

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function ControlButton({
  icon,
  label,
  onClick,
  active,
  activeStyle = "neutralActive",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeStyle?: "danger" | "primary" | "amber" | "neutralActive";
}) {
  const activeColors: Record<string, { bg: string; fg: string }> = {
    danger: { bg: "#E5484D", fg: "#fff" },
    primary: { bg: "#2F6FED", fg: "#fff" },
    amber: { bg: "#D98C1F", fg: "#fff" },
    neutralActive: { bg: "rgba(255,255,255,0.16)", fg: "#fff" },
  };
  const colors = active ? activeColors[activeStyle] : { bg: "rgba(255,255,255,0.08)", fg: "#E7ECF5" };
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: "none",
        cursor: "pointer",
        borderRadius: 999,
        padding: "12px 18px",
        fontSize: 14,
        fontWeight: 700,
        background: colors.bg,
        color: colors.fg,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function SharePanel({
  onClose,
  screenShareOn,
  onToggleScreenShare,
}: {
  onClose: () => void;
  screenShareOn: boolean;
  onToggleScreenShare: () => void;
}) {
  return (
    <div style={s.panel}>
      <PanelHeader title="Share with the class" onClose={onClose} />
      <PanelRow
        icon={<ShareIcon />}
        title="Share my screen"
        subtitle={screenShareOn ? "Sharing — tap to stop" : "Everyone sees your screen"}
        onClick={onToggleScreenShare}
      />
      <PanelRow icon={<PencilIcon />} title="Open whiteboard" subtitle="Write and solve live" comingSoon />
      <PanelRow icon={<DocIcon />} title="Share a document" subtitle="Notes, worksheets, question papers" comingSoon />
      <PanelRow icon={<PollIcon />} title="Send a quick poll" subtitle="Check understanding in 30 seconds" comingSoon />
    </div>
  );
}

function PanelRow({
  icon,
  title,
  subtitle,
  onClick,
  comingSoon,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  comingSoon?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={comingSoon}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "14px 0",
        cursor: comingSoon ? "default" : "pointer",
        opacity: comingSoon ? 0.55 : 1,
      }}
    >
      <span style={s.panelRowIcon}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "#fff" }}>{title}</span>
        <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
          {subtitle}
        </span>
      </span>
      {comingSoon ? (
        <span style={s.comingSoonBadge}>Coming soon</span>
      ) : (
        <span style={{ color: "rgba(255,255,255,0.4)" }}>›</span>
      )}
    </button>
  );
}

function StudentsPanel({
  onClose,
  participants,
  localIdentity,
  canModerate,
  onMute,
}: {
  onClose: () => void;
  participants: Participant[];
  localIdentity: string;
  canModerate: boolean;
  onMute: (identity: string, muted: boolean) => void;
}) {
  return (
    <div style={s.panel}>
      <PanelHeader title={`In class · ${participants.length}`} onClose={onClose} />
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {participants.map((p) => {
          const isSelf = p.identity === localIdentity;
          const raised = p.attributes?.handRaised === "true";
          const muted = !p.isMicrophoneEnabled;
          return (
            <div
              key={p.identity}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={s.rosterAvatar}>
                {(p.name ?? p.identity).slice(0, 2).toUpperCase()}
              </span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#fff" }}>
                {p.name ?? p.identity}
                {isSelf ? " (you)" : ""}
              </span>
              {raised && <span aria-label="Hand raised">✋</span>}
              {canModerate && !isSelf ? (
                <button
                  type="button"
                  onClick={() => onMute(p.identity, !muted)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: muted ? "transparent" : "rgba(255,255,255,0.1)",
                    color: muted ? "rgba(255,255,255,0.6)" : "#22C55E",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {muted ? "Unmute" : "Mute"}
                </button>
              ) : (
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{muted ? "Muted" : ""}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatPanel({
  onClose,
  messages,
  onSend,
}: {
  onClose: () => void;
  messages: { timestamp: number; message: string; from?: { identity: string; name?: string; isLocal?: boolean } }[];
  onSend: (message: string) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setDraft("");
    try {
      await onSend(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={s.panel}>
      <PanelHeader title="Class chat" onClose={onClose} />
      <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", padding: "8px 0" }}>
            No messages yet — say hello.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.timestamp} style={{ alignSelf: m.from?.isLocal ? "flex-end" : "flex-start", maxWidth: "80%" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>
              {m.from?.isLocal ? "You" : m.from?.name ?? m.from?.identity ?? "Someone"}
            </div>
            <div
              style={{
                background: m.from?.isLocal ? "#2F6FED" : "rgba(255,255,255,0.1)",
                color: "#fff",
                borderRadius: 12,
                padding: "9px 13px",
                fontSize: 13.5,
              }}
            >
              {m.message}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Message the class"
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            padding: "11px 14px",
            color: "#fff",
            fontSize: 14,
          }}
        />
        <button
          type="button"
          disabled={sending || !draft.trim()}
          onClick={submit}
          style={{
            border: "none",
            background: "#2F6FED",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 10,
            padding: "0 20px",
            cursor: "pointer",
            opacity: sending || !draft.trim() ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <span style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{title}</span>
      <button
        type="button"
        onClick={onClose}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          border: "none",
          background: "rgba(255,255,255,0.1)",
          color: "#fff",
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ---- Icons (small inline SVGs, matching this app's hand-drawn-icon convention) ----

function iconProps(): React.SVGProps<SVGSVGElement> {
  return { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
}
function MicIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
    </svg>
  );
}
function MicOffIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M3 3l18 18M9 5a3 3 0 0 1 6 0v6c0 .5-.1 1-.3 1.4M5 10a7 7 0 0 0 10.6 6M12 19v3" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="M16 10l6-3v10l-6-3" />
    </svg>
  );
}
function CameraOffIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M3 3l18 18M16 10l6-3v10l-2.5-1.25M2 8v10a2 2 0 0 0 2 2h9" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M9 20h6M12 17v3M8 9l4-3 4 3" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.4 2.7-5.6 6-5.6s6 2.2 6 5.6M16 8.5a2.8 2.8 0 1 1 0-5.6M18 20c0-2.6-1.5-4.6-3.6-5.3" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 4h16v12H8l-4 4V4z" />
    </svg>
  );
}
function EndIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 15c4-4 12-4 16 0l-1.5 3.3a1 1 0 0 1-1.3.5L14 17l-1-2h-2l-1 2-3.2 1.8a1 1 0 0 1-1.3-.5L4 15z" />
    </svg>
  );
}
function HandIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M9 12V5a1.5 1.5 0 0 1 3 0v6M12 11V4a1.5 1.5 0 0 1 3 0v7M15 11.5V6a1.5 1.5 0 0 1 3 0v9c0 3.9-3 6.5-6.5 6.5S5 18.9 5 15.5V13a1.5 1.5 0 0 1 3-.3" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M6 2h9l5 5v15H6V2z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}
function PollIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

// ---- Styles ----

const s: Record<string, React.CSSProperties> = {
  stage: {
    background: "#0B1424",
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    minHeight: 560,
  },
  videoArea: {
    position: "relative",
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 460,
  },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  heroCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" as const },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: "50%",
    background: "#2F6FED",
    color: "#fff",
    fontSize: 30,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heroName: { fontSize: 20, fontWeight: 800, color: "#fff" },
  heroSubtitle: { fontSize: 13.5, color: "rgba(255,255,255,0.6)" },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(10,16,28,0.72)",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
  },
  pillTopLeft: { position: "absolute", top: 16, left: 16 },
  pillGroupTopRight: { position: "absolute", top: 16, right: 16, display: "flex", gap: 8 },
  pillAmber: { background: "#B45309" },
  liveDot: { width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" },
  pip: {
    position: "absolute",
    right: 20,
    bottom: 96,
    width: 150,
    height: 110,
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pipLabel: { fontSize: 12, color: "rgba(255,255,255,0.55)" },
  toast: {
    position: "absolute",
    bottom: 96,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(10,16,28,0.9)",
    color: "#fff",
    borderRadius: 999,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 600,
  },
  controlBar: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
    padding: "18px 16px 22px",
    background: "rgba(0,0,0,0.25)",
  },
  panel: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
    background: "#101B30",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    maxWidth: 480,
    margin: "0 auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  panelRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  comingSoonBadge: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 999,
    padding: "3px 8px",
    whiteSpace: "nowrap",
  },
  rosterAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  center: {
    minHeight: 400,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: "#0B1424",
    borderRadius: 18,
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
    background: "#2F6FED",
    border: "none",
    cursor: "pointer",
  },
};
