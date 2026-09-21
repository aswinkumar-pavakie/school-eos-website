"use client";

// Shared chat UI for the "Ask the Assistant" feature, reused verbatim by
// every role's own thin page.tsx (e.g. (dashboard)/admin/ai-chat/page.tsx)
// and by AskAiWidget's slide-in panel. Talks ONLY to this app's own
// same-origin /api/ai-chat route -- never the bot's URL directly, which
// stays server-only. Holds nothing but local message list + input + an
// opaque conversationId (the bot's own backend owns conversation history;
// this never resends it).
//
// The dotted background (DotGridBackground) is always present behind the
// conversation, matching the user's own reference design; the big 3D logo
// empty state (AiChatEmptyState) is shown ONLY while messages.length === 0
// -- it disappears the instant the first question is sent (not after the
// reply arrives), same as the reference's own "first open only" behavior,
// and never reappears for the rest of this conversation.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DotGridBackground } from "./DotGridBackground";
import { AiChatEmptyState } from "./AiChatEmptyState";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function AiChatScreen({ className }: { className?: string } = {}) {
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

  const isEmpty = messages.length === 0;

  return (
    <div className={className ?? "flex h-[calc(100vh-140px)] flex-col rounded-[14px] border border-border bg-surface"}>
      <div className="relative flex-1 overflow-y-auto">
        <DotGridBackground />
        <div className="relative z-10 flex h-full flex-col p-5">
          {isEmpty ? (
            <AiChatEmptyState />
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] whitespace-pre-wrap rounded-[11px] px-4 py-2.5 text-sm shadow-sm ${
                      m.role === "user" ? "bg-primary text-white" : "bg-surface text-text"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {sending && <p className="text-sm text-text-muted">Thinking…</p>}
            </div>
          )}
          {error && <p className="mt-2 text-sm text-[var(--color-error-text)]">{error}</p>}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="relative z-10 flex items-center gap-2.5 border-t border-border bg-surface p-4"
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
