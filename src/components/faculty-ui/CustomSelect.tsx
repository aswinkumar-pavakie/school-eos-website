"use client";

import { useState, type ReactNode } from "react";
import { ChevronDownIcon, CheckIcon } from "./icons";

// The design's "chevron button + inline expanding options list" dropdown
// (used instead of native <select> in Message's class filter, Entry marks'
// subject/exam pickers, Subject Exams' class picker). Confirmed from the
// source: the options list expands INLINE below the trigger (pushing content
// down), never an absolutely-positioned popover -- so no portal/z-index
// management needed. `trigger` is a render prop so callers can reproduce
// either the design's plain-button style (Message) or its icon-card style
// (Entry marks/Subject exams) around the same open/close + options-list core.
export type SelectOption<T> = { value: T; label: string };

export function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  trigger,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** Render prop: (label, isOpen, toggle) => the trigger element. */
  trigger: (label: string, open: boolean, toggle: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <div>
      {trigger(current?.label ?? "", open, () => setOpen((v) => !v))}
      {open && (
        <div
          style={{
            border: "1px solid var(--fac-border)",
            borderRadius: 11,
            marginTop: 14,
            overflow: "hidden",
          }}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="fac-hover-lift flex w-full items-center text-left"
                style={{
                  border: 0,
                  cursor: "pointer",
                  padding: "13px 16px",
                  borderBottom: "1px solid var(--fac-divider)",
                  font: "500 14.5px/1 var(--fac-font-sans)",
                  background: active ? "var(--fac-tint)" : "var(--fac-white)",
                  color: active ? "var(--fac-primary)" : "var(--fac-body)",
                }}
              >
                <span style={{ flex: 1 }}>{opt.label}</span>
                {active && <CheckIcon />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Plain-button trigger variant (matches the Message screen's class filter):
// full-width bordered button, label left, caret right.
export function plainTrigger(label: string, _open: boolean, toggle: () => void) {
  return (
    <button
      type="button"
      onClick={toggle}
      className="fac-hover-lift flex w-full items-center gap-2.5"
      style={{
        border: "1px solid var(--fac-border)",
        background: "var(--fac-white)",
        borderRadius: "var(--fac-radius-input)",
        padding: "13px 14px",
        cursor: "pointer",
        font: "600 14.5px/1 var(--fac-font-sans)",
        color: "var(--fac-ink)",
        textAlign: "left",
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronDownIcon className="text-[color:var(--fac-body-muted)]" />
    </button>
  );
}

// Icon-card trigger variant (matches Entry marks / Subject exams): a card
// with a tinted icon square, eyebrow label, big value, and chevron -- caller
// supplies its own <Card> wrapper around this trigger via `eyebrow`.
export function iconCardTrigger(eyebrow: string) {
  function IconCardTrigger(label: string, _open: boolean, toggle: () => void) {
    return (
      <button type="button" onClick={toggle} className="flex w-full items-center gap-3.5 border-0 bg-transparent text-left" style={{ cursor: "pointer" }}>
        <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--fac-tint)", flex: "0 0 40px" }} />
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>
            {eyebrow}
          </span>
          <span style={{ display: "block", font: "600 17px/1.2 var(--fac-font-sans)", marginTop: 6, color: "var(--fac-ink)" }}>
            {label}
          </span>
        </span>
        <ChevronDownIcon className="text-[color:var(--fac-body-muted)]" />
      </button>
    );
  }
  return IconCardTrigger;
}
