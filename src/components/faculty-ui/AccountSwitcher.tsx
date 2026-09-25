"use client";

// Account switcher for the Faculty <-> Class Teacher pair, opened from the sidebar
// footer (always offered on the Faculty area).
//  * Faculty login: shows ONLY the class accounts already added on this browser (with
//    their email) -- each switches instantly, no password. Nothing about classes that are
//    not added is shown, so a leaked Faculty password on another browser reveals nothing.
//    "+ Add account" opens a popup asking for the class login's EMAIL and PASSWORD; it
//    signs in only if that login is one the admin mapped to this teacher.
//  * Class Teacher login: the way back to Faculty. Accounts are only ever ADDED from the
//    Faculty login.
// The backend decides what is allowed -- src/lib/account-switch-actions.ts and
// school-eos-website/rnd-linked-account-switching.md.

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { addAccountAction, switchAccountAction, type AddAccountState } from "@/lib/account-switch-actions";
import type { IdentityLabel } from "@/lib/account-switch";
import { CheckIcon, ChevronRightIcon } from "./icons";

export interface SwitcherAvailable {
  linkedPersonId: string;
  /** e.g. "5-B" */
  label: string;
  /** The class login's email -- only ever sent for a class already added on this browser. */
  email?: string | null;
  emailHint: string | null;
  linkedOnThisDevice: boolean;
}

export interface SwitcherData {
  activeLabel: IdentityLabel;
  activeIdentifier: string | null;
  /** e.g. "5-B" while in a class account. */
  activeClass: string | null;
  /** The account we switched out of (id only), for "switch back". */
  home: { personId: string; title: string } | null;
  /** Classes already ADDED on this browser (empty until the teacher adds one). */
  available: SwitcherAvailable[];
}

function SwapIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 4L3 8l4 4" />
      <path d="M3 8h13" />
      <path d="M17 20l4-4-4-4" />
      <path d="M21 16H8" />
    </svg>
  );
}

const inputStyle = {
  width: "100%",
  border: "1px solid var(--fac-border, #cbd5e1)",
  background: "var(--fac-panel, #f8fafc)",
  borderRadius: 9,
  padding: "11px 12px",
  font: "400 14px/1.2 var(--fac-font-sans, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif)",
  color: "var(--fac-ink, #10243f)",
} as const;

/** The "Add account" popup: the class login's email + password. */
function AddAccountDialog({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState<AddAccountState, FormData>(addAccountAction, {});
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    emailRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  return createPortal(
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        role="dialog"
        aria-label="Add account"
        aria-modal="true"
        style={{ width: "100%", maxWidth: 400, maxHeight: "90vh", overflowY: "auto", background: "var(--fac-white, #ffffff)", borderRadius: 16, padding: 24, boxShadow: "var(--fac-shadow-popover-strong, 0 24px 60px rgba(15,23,42,.30))" }}
      >
        <h2 style={{ margin: 0, font: "700 18px/1.2 var(--fac-font-sans, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif)", color: "var(--fac-ink, #10243f)" }}>Add account</h2>
        <p style={{ margin: "8px 0 16px", font: "400 13px/1.5 var(--fac-font-sans, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif)", color: "var(--fac-body-muted, #475569)" }}>
          Enter the email and password of your class teacher login. It is added only if the administrator assigned that
          class to you. You do this once on this browser; after that you can switch without a password.
        </p>
        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, font: "600 12.5px/1 var(--fac-font-sans, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif)", color: "var(--fac-ink, #10243f)" }}>
            Email
            <input ref={emailRef} name="identifier" type="text" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required placeholder="class teacher login email" style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, font: "600 12.5px/1 var(--fac-font-sans, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif)", color: "var(--fac-ink, #10243f)" }}>
            Password
            <input name="password" type="password" autoComplete="off" required placeholder="class teacher login password" style={inputStyle} />
          </label>
          {state.error && (
            <div role="alert" style={{ font: "500 12.5px/1.4 var(--fac-font-sans, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif)", color: "var(--fac-red, #b3261e)" }}>
              {state.error}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="submit"
              disabled={pending}
              style={{ flex: 1, border: 0, cursor: pending ? "default" : "pointer", background: "var(--fac-primary, #1f6feb)", color: "#fff", font: "600 14px/1 var(--fac-font-sans, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif)", borderRadius: 10, padding: "13px 14px", opacity: pending ? 0.7 : 1 }}
            >
              {pending ? "Adding…" : "Add account"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              style={{ border: "1px solid var(--fac-border, #cbd5e1)", cursor: "pointer", background: "var(--fac-white, #ffffff)", color: "var(--fac-ink, #10243f)", font: "600 14px/1 var(--fac-font-sans, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif)", borderRadius: 10, padding: "13px 16px" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export function AccountSwitcher({ data }: { data: SwitcherData }) {
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  const isFaculty = data.activeLabel === "FACULTY";

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const activeTitle = isFaculty ? "Faculty" : `Class Teacher${data.activeClass ? ` · ${data.activeClass}` : ""}`;
  const initials = (text: string) => text.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 3);

  function switchTo(personId: string, title: string, className: string | null) {
    if (isPending) return;
    setMessage(null);
    startTransition(async () => {
      const result = await switchAccountAction(personId, title, className);
      // Reaching here means the switch did NOT redirect (a redirect unmounts this).
      if (result?.error) setMessage(result.error);
    });
  }

  function pickClass(c: SwitcherAvailable) {
    setMessage(null);
    switchTo(c.linkedPersonId, `Class ${c.label}`, c.label);
  }

  const rowButton = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 11,
    textAlign: "left",
    border: 0,
    background: "var(--fac-white)",
    borderRadius: 10,
    padding: "9px 8px",
    ...extra,
  });

  const avatar = (text: string, active: boolean) => (
    <span
      style={{
        width: 36,
        height: 36,
        flex: "0 0 36px",
        borderRadius: "50%",
        background: active ? "var(--fac-navy)" : "var(--fac-tint)",
        color: active ? "#fff" : "var(--fac-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        font: "700 12px/1 var(--fac-font-sans)",
      }}
    >
      {text}
    </span>
  );

  const titleStyle = { display: "block", font: "600 13.5px/1.25 var(--fac-font-sans)", color: "var(--fac-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;
  const metaStyle = { display: "block", font: "400 11.5px/1.3 var(--fac-font-sans)", color: "var(--fac-body-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setMessage(null);
        }}
        title="Switch account"
        aria-label="Switch account"
        aria-expanded={open}
        className="fac-hover-lift"
        style={{
          border: "1px solid var(--fac-border)",
          background: "var(--fac-white)",
          color: "var(--fac-primary)",
          cursor: "pointer",
          width: 34,
          height: 34,
          borderRadius: 9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SwapIcon />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Switch account"
          style={{
            position: "absolute",
            bottom: 46,
            left: -212,
            width: 296,
            zIndex: 60,
            background: "var(--fac-white)",
            border: "1px solid var(--fac-border)",
            borderRadius: 14,
            boxShadow: "var(--fac-shadow-popover-strong)",
            padding: 10,
          }}
        >
          <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".1em", color: "var(--fac-tertiary)", padding: "6px 8px 10px" }}>
            SWITCH ACCOUNT
          </div>

          {/* Active account */}
          <div style={rowButton({ cursor: "default" })}>
            {avatar(isFaculty ? "FA" : initials(data.activeClass ?? "CT"), true)}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={titleStyle}>{activeTitle}</span>
              <span style={metaStyle}>{data.activeIdentifier?.startsWith("person-") ? "Signed in on this browser" : (data.activeIdentifier ?? "Signed in")}</span>
            </span>
            <CheckIcon />
          </div>

          {/* Faculty: classes the admin mapped to me */}
          {isFaculty &&
            data.available.map((c) => (
              <button
                key={c.linkedPersonId}
                type="button"
                onClick={() => pickClass(c)}
                disabled={isPending}
                className="fac-hover-lift"
                style={rowButton({ cursor: "pointer", opacity: isPending ? 0.6 : 1 })}
              >
                {avatar(initials(c.label), false)}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={titleStyle}>Class Teacher · {c.label}</span>
                  <span style={metaStyle}>{c.email ?? c.emailHint ?? "Added on this browser"}</span>
                </span>
                <ChevronRightIcon />
              </button>
            ))}

          {/* Class Teacher: the way back */}
          {!isFaculty && data.home && (
            <button
              type="button"
              onClick={() => switchTo(data.home!.personId, data.home!.title, null)}
              disabled={isPending}
              className="fac-hover-lift"
              style={rowButton({ cursor: "pointer", opacity: isPending ? 0.6 : 1 })}
            >
              {avatar("FA", false)}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={titleStyle}>{data.home.title}</span>
                <span style={metaStyle}>Switch back</span>
              </span>
              <ChevronRightIcon />
            </button>
          )}

          {isFaculty && data.available.length === 0 && (
            <div style={{ margin: "8px 6px", font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
              Add your class teacher account to switch between your accounts.
            </div>
          )}

          {message && (
            <div role="alert" style={{ margin: "8px 6px 2px", font: "500 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-red, #b3261e)" }}>{message}</div>
          )}

          {isFaculty ? (
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setOpen(false);
                setShowAdd(true);
              }}
              className="fac-hover-lift"
              style={{
                width: "100%",
                marginTop: 8,
                border: "1.5px solid var(--fac-primary)",
                background: "var(--fac-white)",
                color: "var(--fac-primary)",
                cursor: "pointer",
                borderRadius: 10,
                padding: "10px 12px",
                font: "600 13px/1 var(--fac-font-sans)",
              }}
            >
              + Add account
            </button>
          ) : (
            <div style={{ margin: "10px 6px 2px", font: "400 12px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
              Accounts are added from your Faculty login.
            </div>
          )}
        </div>
      )}

      {showAdd && isFaculty && <AddAccountDialog onClose={() => setShowAdd(false)} />}
    </div>
  );
}
