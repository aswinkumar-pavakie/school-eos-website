"use client";

import { useState, useTransition } from "react";
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/document-types";
import { PrimaryButton, SecondaryButton } from "@/components/parent-ui/primitives";
import { useFlash } from "@/components/parent-ui/FlashContext";
import { docTypeLabel } from "./labels";
import { createDocumentRequestAction } from "./actions";

export function RequestCertificatePanel({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState<DocumentType | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const { showFlash } = useFlash();

  function reset() {
    setOpen(false);
    setDocType(null);
    setReason("");
    setError(undefined);
  }

  function submit() {
    if (!docType) {
      setError("Select a document type.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    startTransition(async () => {
      setError(undefined);
      try {
        await createDocumentRequestAction(studentId, docType, reason);
        showFlash("Document request submitted.");
        reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not submit the request.");
      }
    });
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card)", marginBottom: 20, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ all: "unset", boxSizing: "border-box", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", cursor: "pointer" }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--par-ink)" }}>Request a certificate</span>
        <span style={{ fontSize: 18, color: "var(--par-tertiary)", transform: open ? "rotate(180deg)" : undefined, transition: "transform .12s ease" }}>⌄</span>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid var(--par-divider)", padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 12 }}>
            Document type
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 10, marginBottom: 20 }}>
            {DOCUMENT_TYPES.map((t) => {
              const active = t === docType;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDocType(t)}
                  style={{
                    all: "unset",
                    boxSizing: "border-box",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: active ? "var(--par-tint)" : "var(--par-panel-2)",
                    border: active ? "1px solid var(--par-primary)" : "1px solid transparent",
                  }}
                >
                  <span style={{ width: 32, height: 32, borderRadius: 9, background: active ? "var(--par-tint-strong)" : "#fff", color: "var(--par-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                      <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h4" />
                    </svg>
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--par-ink)" }}>{docTypeLabel(t)}</span>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
            Reason
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Why is this certificate needed?"
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid var(--par-border)",
              borderRadius: "var(--par-radius-input)",
              padding: "12px 14px",
              fontSize: 14,
              fontFamily: "inherit",
              color: "var(--par-ink)",
              resize: "vertical",
              marginBottom: 14,
            }}
          />

          {error && (
            <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "var(--par-red-bg)", color: "var(--par-red)", fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <SecondaryButton type="button" onClick={reset} disabled={pending}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" onClick={submit} disabled={pending}>
              {pending ? "Submitting…" : "Submit request"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
