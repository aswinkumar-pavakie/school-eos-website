"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";

// Spec: "loading state keeps the button's width and changes its label (no spinner-only
// state)." One primary action per form/sheet; secondary actions never share its visual weight.
const VARIANT_CLASSES = {
  primary: "bg-primary text-white disabled:opacity-50",
  secondary: "border border-border bg-surface text-navy disabled:opacity-50",
  danger: "bg-critical-text text-white disabled:opacity-50",
} as const;

export function Button({
  variant = "primary",
  pendingLabel,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANT_CLASSES;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      {...rest}
      disabled={pending || rest.disabled}
      className={`ui-btn rounded-[10px] px-[18px] py-[11px] text-sm font-semibold leading-[1.2] disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}

// Plain, non-form-status button — for links, dialog triggers, etc.
export function PlainButton({
  variant = "secondary",
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANT_CLASSES }) {
  return (
    <button
      {...rest}
      className={`ui-btn rounded-[10px] px-[18px] py-[11px] text-sm font-semibold leading-[1.2] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
