"use client";

// Global "Ask AI" entry point -- interaction pattern pixel-matched to the
// user's own reference (Cloudflare dashboard's navbar button + right-side
// slide-in panel), but the trigger itself is the user's own second
// reference: an icon-only white rounded-card button with a purple
// chat-bubble-and-dots glyph (ChatBubbleDotsIcon below), replacing the
// earlier "Ask AI" text+sparkle button entirely -- no label, this exact
// icon only. Mounted once in the shared dashboard Shell.tsx and once per
// module-specific shell, so every role's login sees the exact same control
// in the exact same place. Talks to the exact same real /api/ai-chat proxy
// AiChatScreen already used (see that file's own header comment) -- this is
// a presentation wrapper only, no new backend call of its own.
//
// `onOpenChange` (optional) reports the panel's open/closed state up to
// whichever Shell mounts this widget, so that Shell can shrink its own main
// content area to make room for the panel -- a real docked "push" layout
// (per explicit follow-up feedback, matching the Cloudflare reference's own
// panel-open behavior) rather than the panel simply floating on top of an
// unaffected page. This component still owns the open/closed state itself
// and still renders the button + panel from wherever it's mounted (the
// panel is `position: fixed` so its own placement doesn't depend on where
// in the tree it renders from) -- `onOpenChange` is purely an outward
// notification, not a hand-off of control.
//
// Closing is deliberately narrow, per explicit follow-up feedback: only the
// panel's own X button, pressing Esc, or clicking this same trigger icon
// again close it. There is no click-outside-to-close catcher -- an earlier
// pass had a full-viewport invisible overlay for that, which (being
// `position: fixed` over the whole page) silently ate every click AND every
// scroll/wheel gesture on the rest of the app while the panel was open, so
// buttons elsewhere on the page appeared to "close the bot" instead of
// doing their own thing, and the page behind the panel couldn't scroll.
// With the panel open, the rest of the app must stay fully clickable and
// scrollable exactly as when it's closed -- only its width visibly shrinks
// (see each Shell's own onOpenChange-driven marginRight).
export const AI_CHAT_PANEL_WIDTH = 420;

import { useEffect, useState } from "react";
import { AiChatScreen } from "./AiChatScreen";

const BRAND_PURPLE = "#591BDF";

function ChatBubbleDotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5.5 4h13a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 4v-4H5.5A1.5 1.5 0 0 1 4 14.5v-9A1.5 1.5 0 0 1 5.5 4z"
        stroke={BRAND_PURPLE}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9.4" r="0.9" fill={BRAND_PURPLE} />
      <circle cx="12" cy="9.4" r="0.9" fill={BRAND_PURPLE} />
      <circle cx="15" cy="9.4" r="0.9" fill={BRAND_PURPLE} />
    </svg>
  );
}

export function AskAiWidget({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpenState] = useState(false);

  function setOpen(next: boolean) {
    setOpenState(next);
    onOpenChange?.(next);
  }

  // Esc closes the panel, matching the reference's own X-button affordance.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close the Assistant" : "Ask the Assistant"}
        aria-pressed={open}
        className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl bg-surface shadow-[0_2px_10px_rgba(15,23,42,0.08)] transition-all duration-200 hover:shadow-[0_4px_14px_rgba(89,27,223,0.22)] ${
          open ? "ring-2 ring-[rgba(89,27,223,0.35)]" : ""
        }`}
      >
        <ChatBubbleDotsIcon className="h-5 w-5" />
      </button>

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Ask the Assistant"
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ maxWidth: AI_CHAT_PANEL_WIDTH }}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border pl-6 pr-5">
          <div className="flex items-center gap-2">
            <ChatBubbleDotsIcon className="h-[18px] w-[18px]" />
            <span className="text-[15px] font-bold text-text">Ask the Assistant</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg hover:text-text"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          {open ? <AiChatScreen className="flex h-full flex-col rounded-[14px] border border-border bg-surface" /> : null}
        </div>
      </aside>
    </>
  );
}
