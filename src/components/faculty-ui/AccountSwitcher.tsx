"use client";

// Instagram-style account switcher for the Faculty <-> Class Teacher pair,
// opened from the sidebar footer. Lists the active account, every account
// already saved on this browser (instant switch, no password), and -- for a
// Faculty who advises several classes -- each class login not added yet
// (one-time password form, email prefilled). Session movement happens in
// src/lib/account-switch-actions.ts.

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  addAccountAction,
  removeAccountAction,
  switchAccountAction,
  type AddAccountState,
} from "@/lib/account-switch-actions";
import type { IdentityLabel } from "@/lib/account-switch";
import { CheckIcon, ChevronRightIcon, CloseIcon } from "./icons";

export interface SwitcherClass {
  gradeName: string;
  sectionName: string;
  email: string | null;
}

export interface SwitcherData {
  activeLabel: IdentityLabel;
  activeIdentifier: string | null;
  others: { identifier: string; label: IdentityLabel }[];
  /** Every class login this Faculty holds -- names the Class Teacher rows and
   * offers the ones not saved yet. Empty on the Class Teacher side. */
  classes: SwitcherClass[];
}

interface Row {
  key: string;
  label: IdentityLabel;
  identifier: string | null;
  isActive: boolean;
  isSaved: boolean;
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

export function AccountSwitcher({ data }: { data: SwitcherData }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState<Row | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const [addState, addAction, addPending] = useActionState<AddAccountState, FormData>(addAccountAction, {});

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const classFor = (identifier: string | null) => (identifier ? data.classes.find((c) => c.email === identifier) : undefined);

  function titleFor(label: IdentityLabel, identifier: string | null): string {
    if (label === "FACULTY") return "Faculty";
    if (label === "CLASS_TEACHER") {
      const cls = classFor(identifier);
      return cls ? `Class Teacher · ${cls.gradeName} ${cls.sectionName}` : "Class Teacher";
    }
    return "Account";
  }

  function initialsFor(label: IdentityLabel, identifier: string | null): string {
    const cls = classFor(identifier);
    if (cls) return `${cls.gradeName.replace(/\D/g, "")}${cls.sectionName}`.toUpperCase().slice(0, 3);
    return label === "FACULTY" ? "FA" : label === "CLASS_TEACHER" ? "CT" : "AC";
  }

  const rows: Row[] = [
    { key: "active", label: data.activeLabel, identifier: data.activeIdentifier, isActive: true, isSaved: true },
    ...data.others.map((o) => ({ key: o.identifier, label: o.label, identifier: o.identifier, isActive: false, isSaved: true })),
  ];
  if (data.activeLabel === "FACULTY") {
    const known = new Set([data.activeIdentifier, ...data.others.map((o) => o.identifier)]);
    for (const c of data.classes) {
      if (c.email && !known.has(c.email)) {
        rows.push({ key: c.email, label: "CLASS_TEACHER", identifier: c.email, isActive: false, isSaved: false });
      }
    }
  } else if (!data.others.some((o) => o.label === "FACULTY")) {
    rows.push({ key: "add-faculty", label: "FACULTY", identifier: null, isActive: false, isSaved: false });
  }

  function select(row: Row) {
    if (row.isActive || isPending) return;
    setMessage(null);
    if (!row.isSaved) {
      setAdding(row);
      return;
    }
    startTransition(async () => {
      const result = await switchAccountAction(row.identifier ?? "");
      // Reaching here means the switch did NOT redirect (a redirect unmounts
      // this component): the saved session was missing or had expired.
      if (result?.error) setMessage(result.error);
      if (result?.needsPassword) setAdding({ ...row, isSaved: false });
    });
  }

  function remove(row: Row) {
    startTransition(async () => {
      await removeAccountAction(row.identifier ?? "");
    });
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setAdding(null);
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

          {rows.map((row) => (
            <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                type="button"
                onClick={() => select(row)}
                disabled={row.isActive || isPending}
                className="fac-hover-lift"
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  textAlign: "left",
                  border: 0,
                  cursor: row.isActive ? "default" : "pointer",
                  background: adding?.key === row.key ? "var(--fac-tint)" : "var(--fac-white)",
                  borderRadius: 10,
                  padding: "9px 8px",
                  opacity: isPending && !row.isActive ? 0.6 : 1,
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    flex: "0 0 36px",
                    borderRadius: "50%",
                    background: row.isActive ? "var(--fac-navy)" : "var(--fac-tint)",
                    color: row.isActive ? "#fff" : "var(--fac-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    font: "700 12px/1 var(--fac-font-sans)",
                  }}
                >
                  {initialsFor(row.label, row.identifier)}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", font: "600 13.5px/1.25 var(--fac-font-sans)", color: "var(--fac-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {titleFor(row.label, row.identifier)}
                  </span>
                  <span style={{ display: "block", font: "400 11.5px/1.3 var(--fac-font-sans)", color: "var(--fac-body-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.identifier?.startsWith("person-")
                      ? "Signed in on this browser"
                      : (row.identifier ?? "Tap to add this account")}
                    {!row.isSaved && row.identifier ? " · tap to add" : ""}
                  </span>
                </span>
                {row.isActive ? <CheckIcon /> : <ChevronRightIcon />}
              </button>
              {row.isSaved && !row.isActive && (
                <button
                  type="button"
                  onClick={() => remove(row)}
                  disabled={isPending}
                  title="Remove from this browser"
                  aria-label={`Remove ${titleFor(row.label, row.identifier)}`}
                  style={{ border: 0, background: "none", cursor: "pointer", padding: 6, borderRadius: 7 }}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          ))}

          {message && (
            <div style={{ margin: "8px 6px 2px", font: "500 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-primary)" }}>{message}</div>
          )}

          {adding && (
            <form action={addAction} style={{ marginTop: 8, padding: "12px 8px 4px", borderTop: "1px solid var(--fac-divider)", display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ font: "600 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>
                Sign in to {titleFor(adding.label, adding.identifier)} once
              </div>
              <input
                name="identifier"
                type="text"
                defaultValue={adding.identifier ?? ""}
                readOnly={adding.identifier !== null}
                placeholder="Email"
                autoComplete="username"
                required
                style={{ border: "1px solid var(--fac-border)", background: "var(--fac-panel)", borderRadius: 8, padding: "9px 11px", font: "400 13px/1.2 var(--fac-font-sans)", color: "var(--fac-ink)" }}
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                required
                autoFocus
                style={{ border: "1px solid var(--fac-border)", background: "var(--fac-panel)", borderRadius: 8, padding: "9px 11px", font: "400 13px/1.2 var(--fac-font-sans)", color: "var(--fac-ink)" }}
              />
              {addState.error && (
                <div role="alert" style={{ font: "500 12.5px/1.4 var(--fac-font-sans)", color: "#b42318" }}>{addState.error}</div>
              )}
              <button
                type="submit"
                disabled={addPending}
                style={{ border: 0, cursor: addPending ? "default" : "pointer", background: "var(--fac-primary)", color: "#fff", font: "600 13px/1 var(--fac-font-sans)", borderRadius: 8, padding: "11px 14px", opacity: addPending ? 0.7 : 1 }}
              >
                {addPending ? "Signing in…" : "Add & switch"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
