"use client";

// Shared chat UI for the "Ask the Assistant" feature, reused verbatim by
// every role's own thin page.tsx (e.g. (dashboard)/admin/ai-chat/page.tsx).
// Talks ONLY to this app's own same-origin /api/ai-chat route -- never the
// bot's URL directly, which stays server-only. Holds nothing but local
// message list + input + an opaque conversationId (the bot's own backend
// owns conversation history; this never resends it).

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function AiChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  async function send() {
    const question = input.trim();
    if (!question || sending) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setSending(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, conversationId: conversationIdRef.current }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        setError(retryAfter ? `The assistant is busy. Try again in ${retryAfter}s.` : "The assistant is busy. Please try again shortly.");
        return;
      }

      const body = (await res.json().catch(() => null)) as { answer?: string; conversationId?: string; message?: string } | null;

      if (!res.ok || !body?.answer) {
        setError(body?.message ?? "Could not reach the assistant. Please try again shortly.");
        return;
      }

      conversationIdRef.current = body.conversationId ?? conversationIdRef.current;
      setMessages((prev) => [...prev, { role: "assistant", text: body.answer! }]);
    } catch {
      setError("Could not reach the assistant. Please try again shortly.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col rounded-[14px] border border-border bg-surface">
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-text-muted">Ask a question about school records, policies or anything else — the assistant will help.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] whitespace-pre-wrap rounded-[11px] px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-primary text-white" : "bg-field text-text"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending && <p className="text-sm text-text-muted">Thinking…</p>}
        {error && <p className="text-sm text-[var(--color-error-text)]">{error}</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex items-center gap-2.5 border-t border-border p-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          disabled={sending}
          className="min-w-0 flex-1 rounded-[11px] border border-border bg-field px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
