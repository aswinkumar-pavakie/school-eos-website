"use client";

// Dashboard's "Recent parent messages" preview -- real E2EE conversations
// (@/lib/messaging-actions, the same data the full Message screen reads),
// not the old legacy /messages module this card used to pull from. Matches
// the brain design's own intent for this card (brain/SIS Class teacher/
// Class Teacher Portal.dc.html's own dashMessages: a live preview of the
// same real threads, clicking one opens that exact conversation) -- this
// was the one real inconsistency flagged after connecting messaging for
// every role: a dashboard preview quietly showing different data than the
// real Message screen right next to it.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useE2eeBootstrap } from "@/lib/e2ee/bootstrap";
import { resolveDisplayName } from "@/lib/e2ee/nameCache";
import { listConversationsAction, type ConversationSummary } from "@/lib/messaging-actions";
import { Card } from "@/components/faculty-ui/Card";
import { Avatar } from "@/components/faculty-ui/Avatar";

function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export function RecentMessagesCard({ personId }: { personId: string }) {
  useE2eeBootstrap(personId);
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);

  useEffect(() => {
    if (!personId) return;
    const timer = setTimeout(() => {
      listConversationsAction()
        .then((res) => setConversations(res.data))
        .catch(() => setConversations([]));
    }, 0);
    return () => clearTimeout(timer);
  }, [personId]);

  return (
    <Card>
      <h3 style={{ margin: "0 0 14px", font: "700 19px/1.2 var(--fac-font-sans)" }}>Recent parent messages</h3>
      {conversations === null ? (
        <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Loading…</p>
      ) : conversations.length === 0 ? (
        <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No conversations yet.</p>
      ) : (
        conversations.slice(0, 3).map((c) => {
          const otherId = c.personAId === personId ? c.personBId : c.personAId;
          const name = resolveDisplayName(otherId);
          return (
            <Link
              key={c.id}
              href={`/faculty/message/${c.id}`}
              className="fac-hover-lift flex gap-3"
              style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}
            >
              <Avatar initials={initialsOf(name)} size="sm" />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="flex items-center justify-between gap-2.5">
                  <span style={{ font: "600 14px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{name}</span>
                  <span style={{ font: "400 12px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                    {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                  </span>
                </span>
                <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-body)", marginTop: 3 }}>
                  {c.mlsWelcome ? "New conversation" : "Encrypted message"}
                </span>
              </span>
            </Link>
          );
        })
      )}
    </Card>
  );
}
