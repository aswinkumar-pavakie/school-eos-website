"use client";

import { useEffect, useState } from "react";
import { friendlyMessagingError } from "@/lib/messaging-errors";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/faculty-ui/BackButton";
import { createMessageRequest, startDirectConversation } from "@/lib/e2ee/conversationCreation";
import { subscribeDirectory } from "@/lib/e2ee/directoryWalk";
import type { DiscoveryItem } from "@/lib/messaging-actions";

// Directory pages cap at 100 (the backend's own hard limit) -- walks every
// page via nextCursor and hands the screen one combined list, scoped
// contacts first then everyone else.

export function DiscoveryClient({ personId }: { personId: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [allItems, setAllItems] = useState<DiscoveryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(true);
  const [selected, setSelected] = useState<DiscoveryItem | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeDirectory(personId, (items, done) => {
      setAllItems(items);
      setLoading(false);
      setLoadingMore(!done);
    });
  }, [personId]);

  const needle = search.trim().toLowerCase();
  const items = needle ? (allItems ?? []).filter((i) => i.displayName.toLowerCase().includes(needle)) : allItems ?? [];
  const scoped = items.filter((i) => i.scope === "SCOPED");
  const unscoped = items.filter((i) => i.scope === "UNSCOPED");

  async function handleSend() {
    if (!selected) return;
    const trimmed = draft.trim();
    if (selected.messagingMode === "REQUEST" && trimmed.length === 0) return;
    setSending(true);
    setError(null);
    try {
      const result =
        selected.messagingMode === "DIRECT"
          ? await startDirectConversation({ targetPersonId: selected.userId, plaintext: trimmed || undefined })
          : await createMessageRequest({ targetPersonId: selected.userId, plaintext: trimmed });
      router.replace(`/faculty/message/${result.conversationId}`);
    } catch (err) {
      setError(friendlyMessagingError(err, "Could not send."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <BackButton href="/faculty/message" label="Back to messages" />
      <h1 style={{ margin: "18px 0 0", font: "700 34px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-navy)" }}>New message</h1>

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, background: "var(--fac-panel)", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "12px 14px" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people…" style={{ flex: 1, border: 0, background: "none", outline: "none", font: "400 14px/1 var(--fac-font-sans)" }} />
      </div>

      <div style={{ marginTop: 16, maxHeight: 420, overflow: "auto", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)" }}>
        {loading ? (
          <p style={{ textAlign: "center", padding: 30, font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Loading…</p>
        ) : scoped.length === 0 && unscoped.length === 0 ? (
          <p style={{ textAlign: "center", padding: 30, font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No matches.</p>
        ) : (
          <>
            {scoped.length > 0 && (
              <div style={{ font: "700 11px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)", textTransform: "uppercase", padding: "14px 16px 8px" }}>
                People you can message directly
              </div>
            )}
            {scoped.map((item) => (
              <DiscoveryRow key={item.userId} item={item} active={selected?.userId === item.userId} onClick={() => setSelected(item)} />
            ))}
            {unscoped.length > 0 && (
              <div style={{ font: "700 11px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)", textTransform: "uppercase", padding: "14px 16px 8px" }}>
                Other School EOS users
              </div>
            )}
            {unscoped.map((item) => (
              <DiscoveryRow key={item.userId} item={item} active={selected?.userId === item.userId} onClick={() => setSelected(item)} />
            ))}
          </>
        )}
      </div>

      {selected && (
        <div style={{ marginTop: 16, background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 18 }}>
          <div className="flex items-center justify-between">
            <div style={{ font: "700 14.5px/1.3 var(--fac-font-sans)" }}>
              {selected.messagingMode === "REQUEST" ? `Send a message request to ${selected.displayName}` : `Message ${selected.displayName}`}
            </div>
            <button type="button" onClick={() => setSelected(null)} style={{ border: 0, background: "none", cursor: "pointer", color: "var(--fac-tertiary)", font: "600 13px/1 var(--fac-font-sans)" }}>
              ✕
            </button>
          </div>
          {error && <p style={{ font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-red-text)", marginTop: 8 }}>{error}</p>}
          <div className="flex items-end gap-2.5" style={{ marginTop: 10 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={selected.messagingMode === "REQUEST" ? "Write your one message (required)…" : "Write a message (optional)…"}
              rows={2}
              style={{ flex: 1, border: "1px solid var(--fac-border)", borderRadius: 14, padding: "10px 16px", font: "400 14px/1.4 var(--fac-font-sans)", resize: "vertical" }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || (selected.messagingMode === "REQUEST" && !draft.trim())}
              style={{ width: 44, height: 44, flex: "0 0 44px", border: 0, borderRadius: "50%", background: "var(--fac-primary)", color: "#fff", cursor: "pointer", opacity: sending ? 0.7 : 1 }}
            >
              {sending ? "…" : "➤"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DiscoveryRow({ item, active, onClick }: { item: DiscoveryItem; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fac-hover-lift flex w-full items-center gap-3"
      style={{ border: 0, cursor: "pointer", padding: "11px 16px", borderBottom: "1px solid var(--fac-divider)", background: active ? "var(--fac-tint)" : "var(--fac-white)", textAlign: "left" }}
    >
      <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--fac-panel)", color: "var(--fac-ink)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 12px/1 var(--fac-font-sans)", flex: "0 0 36px" }}>
        {item.displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", font: "600 14px/1.3 var(--fac-font-sans)" }}>{item.displayName}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          {/* Real schools have many staff/students/parents who share a first+last
              name -- Discovery shows every one of them with no other identifying
              detail, so the role is the ONLY thing that tells two same-named
              people apart. Made a solid, colored pill (not plain grey text) after
              a real mix-up: two different real people both named "Kalpana
              Palaniappan" -- one FACULTY, one an unrelated PARENT -- looked
              identical enough at a glance that the wrong one got messaged. A
              missing/null role (seen on at least one real account with no active
              role_assignment at all) is flagged in red, not left blank, since an
              inconspicuous blank label is exactly what makes an odd account easy
              to click by mistake. */}
          <span
            style={{
              font: "700 10.5px/1 var(--fac-font-sans)",
              letterSpacing: ".04em",
              textTransform: "uppercase",
              borderRadius: 6,
              padding: "3px 7px",
              background: item.role ? "var(--fac-tint)" : "var(--fac-red-bg)",
              color: item.role ? "var(--fac-primary)" : "var(--fac-red-text)",
            }}
          >
            {item.role ?? "No role on file"}
          </span>
          {item.designation && <span style={{ font: "400 12px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>{item.designation}</span>}
        </span>
      </span>
      {item.messagingMode === "REQUEST" && <span style={{ font: "700 10px/1 var(--fac-font-sans)", letterSpacing: ".05em", color: "var(--fac-primary)", textTransform: "uppercase" }}>Request</span>}
    </button>
  );
}
