"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Avatar } from "../Avatar";
import { SendIcon, ChevronDownIcon } from "../icons";

export interface MessengerThread {
  id: string;
  name: string;
  sub: string;
  classLabel: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  unreadCount: number;
}
export interface MessengerMessage {
  id: string;
  text: string;
  createdAt: string;
  fromMe: boolean;
}

// Matches the real language set the mobile app's own "Translate" feature
// offers (features/messaging/screens/ConversationScreen.tsx).
const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ta", label: "Tamil" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
];

// Shared two-pane messenger -- used both full-page (Message screen) and
// inside FacultyModal for the global "Message parents" overlay. Fetches
// messages for a thread on selection and sends via the passed-in server
// actions (kept generic here so both call sites can wire their own real
// backend without duplicating this component). Real translate and
// "Message Principal" capabilities (matching the mobile app's own Messaging
// feature exactly) are optional props -- only the full Message screen wires
// them today; the lighter global modal still works unchanged without them.
export function Messenger({
  threads,
  classFilters,
  initialThreadId,
  onLoadMessages,
  onSend,
  onTranslate,
  onMessagePrincipal,
}: {
  threads: MessengerThread[];
  classFilters: string[];
  initialThreadId?: string;
  onLoadMessages: (conversationId: string) => Promise<MessengerMessage[]>;
  onSend: (conversationId: string, body: string) => Promise<{ error?: string }>;
  onTranslate?: (conversationId: string, messageId: string, targetLanguage: string) => Promise<{ translatedText: string }>;
  onMessagePrincipal?: () => Promise<{ error?: string; conversationId?: string }>;
}) {
  const [classFilter, setClassFilter] = useState<string>("All classes");
  const [classDropOpen, setClassDropOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | undefined>(initialThreadId ?? threads[0]?.id);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [startingPrincipal, setStartingPrincipal] = useState(false);

  const filtered = threads.filter((t) => {
    if (classFilter !== "All classes" && t.classLabel !== classFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return t.name.toLowerCase().includes(q) || t.sub.toLowerCase().includes(q);
  });
  const active = threads.find((t) => t.id === activeId);

  useEffect(() => {
    if (!activeId) return;
    // setState must happen inside a callback, never synchronously in the
    // effect body (react-hooks/set-state-in-effect) -- a 0ms timeout keeps
    // this imperceptible to the user while satisfying that.
    const timer = setTimeout(() => setTranslations({}), 0);
    startTransition(() => {
      onLoadMessages(activeId).then(setMessages);
    });
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleTranslate(targetLanguage: string) {
    setLanguagePickerOpen(false);
    if (!activeId || !onTranslate || messages.length === 0) return;
    setTranslating(true);
    const results = await Promise.all(
      messages.map((m) => onTranslate(activeId, m.id, targetLanguage).then((r) => [m.id, r.translatedText] as const).catch(() => null)),
    );
    const next: Record<string, string> = {};
    for (const r of results) if (r) next[r[0]] = r[1];
    setTranslations(next);
    setTranslating(false);
  }

  async function handleMessagePrincipal() {
    if (!onMessagePrincipal) return;
    setStartingPrincipal(true);
    const result = await onMessagePrincipal();
    setStartingPrincipal(false);
    if (result.conversationId) setActiveId(result.conversationId);
  }

  async function send(text: string) {
    if (!activeId || !text.trim()) return;
    setDraft("");
    const result = await onSend(activeId, text);
    if (!result.error) {
      onLoadMessages(activeId).then(setMessages);
    }
  }

  return (
    <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", display: "flex", minHeight: 560, overflow: "hidden" }}>
      <div style={{ width: 360, borderRight: "1px solid var(--fac-border)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 16 }}>
          <button
            type="button"
            onClick={() => setClassDropOpen((v) => !v)}
            className="fac-hover-lift flex w-full items-center gap-2.5"
            style={{ border: "1px solid var(--fac-border)", background: "var(--fac-white)", borderRadius: 10, padding: "13px 14px", cursor: "pointer", font: "600 14.5px/1 var(--fac-font-sans)", color: "var(--fac-ink)" }}
          >
            <span style={{ flex: 1, textAlign: "left" }}>{classFilter}</span>
            <ChevronDownIcon className="text-[color:var(--fac-body-muted)]" />
          </button>
          {classDropOpen && (
            <div style={{ border: "1px solid var(--fac-border)", borderRadius: 10, marginTop: 8, overflow: "hidden" }}>
              {["All classes", ...classFilters].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setClassFilter(c);
                    setClassDropOpen(false);
                  }}
                  className="fac-hover-lift flex w-full items-center text-left"
                  style={{ border: 0, cursor: "pointer", padding: "12px 14px", borderBottom: "1px solid var(--fac-divider)", font: "500 14px/1 var(--fac-font-sans)", background: c === classFilter ? "var(--fac-tint)" : "var(--fac-white)", color: c === classFilter ? "var(--fac-primary)" : "var(--fac-body)" }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--fac-panel)", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "11px 13px", marginTop: 10 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or parent name" style={{ flex: 1, minWidth: 0, border: 0, background: "none", outline: "none", font: "400 14px/1 var(--fac-font-sans)" }} />
          </div>
          {onMessagePrincipal && (
            <button
              type="button"
              onClick={handleMessagePrincipal}
              disabled={startingPrincipal}
              style={{ width: "100%", marginTop: 10, border: 0, cursor: "pointer", background: "var(--fac-primary)", color: "#fff", borderRadius: 10, padding: "12px 0", font: "600 13.5px/1 var(--fac-font-sans)", opacity: startingPrincipal ? 0.7 : 1 }}
            >
              {startingPrincipal ? "Opening…" : "+ Message Principal"}
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "0 16px 16px" }}>
          <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", padding: "6px 4px 10px" }}>{filtered.length} CONVERSATIONS</div>
          {filtered.length === 0 && <div style={{ padding: "20px 6px", font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No parent matches that search.</div>}
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveId(t.id)}
              className="flex w-full text-left"
              style={{ gap: 12, border: `1px solid ${t.id === activeId ? "var(--fac-outline-hover)" : "var(--fac-border)"}`, cursor: "pointer", borderRadius: 11, padding: 12, marginBottom: 8, background: t.id === activeId ? "var(--fac-tint)" : "var(--fac-white)" }}
            >
              <Avatar initials={t.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()} size="sm" />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="flex justify-between gap-2">
                  <span style={{ font: "600 14px/1.3 var(--fac-font-sans)" }}>{t.name}</span>
                  <span style={{ font: "400 12px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                    {t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                  </span>
                </span>
                <span style={{ display: "block", font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 2 }}>{t.sub}</span>
                <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-body)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.lastMessagePreview}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {active ? (
          <>
            <div className="flex items-center gap-3" style={{ padding: "16px 20px", borderBottom: "1px solid var(--fac-border)", position: "relative" }}>
              <Avatar initials={active.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()} size="sm" />
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", font: "600 15.5px/1.3 var(--fac-font-sans)" }}>{active.name}</span>
                <span style={{ display: "block", font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>{active.sub}</span>
              </span>
              {onTranslate && (
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setLanguagePickerOpen((v) => !v)}
                    disabled={translating}
                    style={{ border: "1px solid var(--fac-border)", background: "var(--fac-white)", cursor: "pointer", borderRadius: 9, padding: "9px 14px", font: "600 12.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}
                  >
                    {translating ? "Translating…" : "Translate"}
                  </button>
                  {languagePickerOpen && (
                    <div style={{ position: "absolute", right: 0, top: "110%", zIndex: 10, border: "1px solid var(--fac-border)", background: "var(--fac-white)", borderRadius: 10, boxShadow: "0 18px 40px rgba(15,23,42,.12)", overflow: "hidden", minWidth: 150 }}>
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => handleTranslate(l.code)}
                          className="flex w-full text-left"
                          style={{ border: 0, cursor: "pointer", padding: "10px 14px", borderBottom: "1px solid var(--fac-divider)", font: "500 13.5px/1 var(--fac-font-sans)", background: "var(--fac-white)" }}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: 20, background: "var(--fac-panel)" }}>
              {isPending ? (
                <div style={{ textAlign: "center", font: "400 13px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Loading…</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", font: "400 13px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No messages yet.</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: m.fromMe ? "flex-end" : "flex-start", marginBottom: 12 }}>
                    <div
                      style={{
                        maxWidth: "66%",
                        borderRadius: 13,
                        padding: "12px 15px",
                        border: `1px solid ${m.fromMe ? "var(--fac-primary)" : "var(--fac-border)"}`,
                        background: m.fromMe ? "var(--fac-primary)" : "var(--fac-white)",
                        color: m.fromMe ? "#fff" : "var(--fac-ink)",
                      }}
                    >
                      <div style={{ font: "400 14.5px/1.5 var(--fac-font-sans)" }}>{m.text}</div>
                      {translations[m.id] && (
                        <div
                          style={{
                            font: "400 13.5px/1.5 var(--fac-font-sans)",
                            fontStyle: "italic",
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: `1px solid ${m.fromMe ? "rgba(255,255,255,.3)" : "var(--fac-divider)"}`,
                            color: m.fromMe ? "rgba(255,255,255,.9)" : "var(--fac-body)",
                          }}
                        >
                          {translations[m.id]}
                        </div>
                      )}
                      <div style={{ font: "400 11.5px/1 var(--fac-font-sans)", marginTop: 7, color: m.fromMe ? "rgba(255,255,255,.75)" : "var(--fac-tertiary)" }}>
                        {new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--fac-border)" }}>
              <div className="flex gap-2.5">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send(draft);
                  }}
                  placeholder="Write a reply"
                  style={{ flex: 1, border: "1px solid var(--fac-border)", borderRadius: 22, padding: "13px 18px", font: "400 14.5px/1 var(--fac-font-sans)" }}
                />
                <button
                  type="button"
                  onClick={() => send(draft)}
                  style={{ width: 46, height: 46, border: 0, borderRadius: "50%", background: "var(--fac-primary)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
            Select a conversation.
          </div>
        )}
      </div>
    </div>
  );
}
