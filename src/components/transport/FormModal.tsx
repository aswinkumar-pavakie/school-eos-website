"use client";

// Shared modal chrome for every Transport Manager "Add X" flow, pixel-matched
// to the mockup's own FORMS registry (Transport Module.dc.html lines
// 992-1024: each entry has a title/sub/cta/cols, rendered through the same
// popup shell) -- backdrop, centered white card, title+subtitle+close button
// header. Callers own the field grid and footer buttons as children so each
// form can use its own real column count/fields.
//
// Rendered through a portal into document.body -- several of this role's own
// cards (Transport command centre, Needs attention, Notices) have their own
// `hover:-translate-y-1` lift effect, and a CSS `transform` on an ancestor
// creates a new containing block for any `position:fixed` descendant. Since
// the trigger button that opens this modal lives inside one of those cards,
// the mouse is necessarily hovering it at the moment of the click, so the
// transform is genuinely active right then -- without the portal, this
// modal's "fixed, centered on the viewport" positioning silently became
// "fixed, centered on that card" instead, a real bug, not a styling choice.

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function FormModal({
  title,
  subtitle,
  onClose,
  maxWidthPx = 960,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  maxWidthPx?: number;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }} onClick={onClose}>
      <div
        className="w-full rounded-[18px] bg-white p-7 shadow-2xl"
        style={{ maxWidth: maxWidthPx }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-extrabold tracking-[-0.01em]" style={{ color: "#0F172A" }}>
              {title}
            </h2>
            <p className="mt-1 text-[14px]" style={{ color: "#64748B" }}>
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ border: "1px solid #E2E8F0", color: "#334155" }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalField({
  label,
  name,
  type = "text",
  required,
  disabled,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string | number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: "#64748B" }}>
        {label}
        {required && <span style={{ color: "#1E3A8A" }}> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        className="rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-primary disabled:opacity-60"
        style={{ border: "1px solid #E2E8F0", color: "#0F172A" }}
      />
    </label>
  );
}

export function ModalSelect({
  label,
  name,
  disabled,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  disabled?: boolean;
  defaultValue?: string;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: "#64748B" }}>
        {label}
      </span>
      <select
        name={name}
        disabled={disabled}
        defaultValue={defaultValue ?? ""}
        className="rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-primary disabled:opacity-60"
        style={{ border: "1px solid #E2E8F0", color: "#0F172A" }}
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ModalFooter({
  onClose,
  isPending,
  submitLabel,
  pendingLabel = "Saving…",
}: {
  onClose: () => void;
  isPending: boolean;
  submitLabel: string;
  pendingLabel?: string;
}) {
  return (
    <div className="col-span-full mt-2 flex items-center justify-end gap-2.5">
      <button
        type="button"
        onClick={onClose}
        className="rounded-[10px] px-4 py-[11px] text-[14px] font-semibold"
        style={{ border: "1px solid #E2E8F0", color: "#334155" }}
      >
        Close
      </button>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-[10px] px-4 py-[11px] text-[14px] font-bold text-white disabled:opacity-60"
        style={{ background: "#1D4ED8" }}
      >
        {isPending ? pendingLabel : submitLabel}
      </button>
    </div>
  );
}
