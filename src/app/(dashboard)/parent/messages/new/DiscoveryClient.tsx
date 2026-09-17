"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { rememberNamesFromDiscovery } from "@/lib/e2ee/nameCache";
import { createMessageRequest, startDirectConversation } from "@/lib/e2ee/conversationCreation";
import { discoverUsersAction, type DiscoveryItem } from "@/lib/messaging-actions";

const PAGE_LIMIT = 100;
const MAX_PAGES = 200;

async function discoverAll(search: string): Promise<DiscoveryItem[]> {
  const items: DiscoveryItem[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data } = await discoverUsersAction({ search: search || undefined, cursor, limit: PAGE_LIMIT });
    for (const item of data.items) {
      if (seen.has(item.userId)) continue;
      seen.add(item.userId);
      items.push(item);
    }
    if (!data.nextCursor || data.nextCursor === cursor) break;
    cursor = data.nextCursor;
  }
  rememberNamesFromDiscovery(items);
  return items;
}

export function DiscoveryClient() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<DiscoveryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DiscoveryItem | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      discoverAll(search).then(setItems).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const scoped = (items ?? []).filter((i) => i.scope === "SCOPED");
  const unscoped = (items ?? []).filter((i) => i.scope === "UNSCOPED");

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
      router.replace(`/parent/messages/${result.conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <Link href="/parent/messages" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--par-border)", background: "#fff", borderRadius: 9, padding: "10px 15px", fontSize: 13.5, fontWeight: 700, color: "var(--par-navy)", textDecoration: "none" }}>
        ‹ Back to messages
      </Link>
      <div style={{ marginTop: 18, fontSize: 34, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--par-ink)" }}>New message</div>

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, background: "var(--par-panel-2)", border: "1px solid var(--par-border)", borderRadius: 10, padding: "12px 14px" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people…" style={{ flex: 1, border: 0, background: "none", outline: "none", fontSize: 14, fontFamily: "inherit" }} />
      </div>

      <div style={{ marginTop: 16, maxHeight: 420, overflow: "auto", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 30, fontSize: 14, color: "var(--par-tertiary)" }}>Loading…</div>
        ) : scoped.length === 0 && unscoped.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, fontSize: 14, color: "var(--par-tertiary)" }}>No matches.</div>
        ) : (
          <>
            {scoped.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--par-tertiary)", textTransform: "uppercase", padding: "14px 16px 8px" }}>People you can message directly</div>}
            {scoped.map((item) => (
              <DiscoveryRow key={item.userId} item={item} active={selected?.userId === item.userId} onClick={() => setSelected(item)} />
            ))}
            {unscoped.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--par-tertiary)", textTransform: "uppercase", padding: "14px 16px 8px" }}>Other School EOS users</div>}
            {unscoped.map((item) => (
              <DiscoveryRow key={item.userId} item={item} active={selected?.userId === item.userId} onClick={() => setSelected(item)} />
            ))}
          </>
        )}
      </div>

      {selected && (
        <div style={{ marginTop: 16, background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card)", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--par-ink)" }}>
              {selected.messagingMode === "REQUEST" ? `Send a message request to ${selected.displayName}` : `Message ${selected.displayName}`}
            </div>
            <button type="button" onClick={() => setSelected(null)} style={{ border: 0, background: "none", cursor: "pointer", color: "var(--par-tertiary)", fontSize: 13, fontWeight: 700 }}>
              ✕
            </button>
          </div>
          {error && <div style={{ fontSize: 12.5, color: "var(--par-red)", marginTop: 8 }}>{error}</div>}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 10 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={selected.messagingMode === "REQUEST" ? "Write your one message (required)…" : "Write a message (optional)…"}
              rows={2}
              style={{ flex: 1, border: "1px solid var(--par-border)", borderRadius: 14, padding: "10px 16px", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || (selected.messagingMode === "REQUEST" && !draft.trim())}
              style={{ width: 44, height: 44, flexShrink: 0, border: 0, borderRadius: "50%", background: "var(--par-primary)", color: "#fff", cursor: "pointer", opacity: sending ? 0.7 : 1 }}
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
      className="parent-row-hover"
      style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, border: 0, cursor: "pointer", padding: "11px 16px", borderBottom: "1px solid var(--par-divider)", background: active ? "var(--par-tint)" : "#fff", textAlign: "left" }}
    >
      <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--par-panel)", color: "var(--par-ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
        {item.displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--par-ink)" }}>{item.displayName}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", borderRadius: 6, padding: "3px 7px", background: item.role ? "var(--par-tint)" : "var(--par-red-bg)", color: item.role ? "var(--par-primary)" : "var(--par-red)" }}>
            {item.role ?? "No role on file"}
          </span>
          {item.designation && <span style={{ fontSize: 12, color: "var(--par-tertiary)" }}>{item.designation}</span>}
        </span>
      </span>
      {item.messagingMode === "REQUEST" && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--par-primary)", textTransform: "uppercase" }}>Request</span>}
    </button>
  );
}
