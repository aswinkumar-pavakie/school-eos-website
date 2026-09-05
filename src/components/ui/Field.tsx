import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// Spec: eyebrow-style field labels, validate on blur (not per-keystroke — enforced by
// using native/server validation, not onChange handlers), errors read like "Reason ·
// required" in red above the control.
function Label({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-bold tracking-wide text-text-muted uppercase">
      {children}
    </label>
  );
}

const controlClass =
  "rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary disabled:opacity-60";

export function TextField({ label, name, ...rest }: { label: string } & InputHTMLAttributes<HTMLInputElement> & { name: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <input id={name} name={name} className={controlClass} {...rest} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  children,
  ...rest
}: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement> & { name: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select id={name} name={name} className={controlClass} {...rest}>
        {children}
      </select>
    </div>
  );
}

export function TextAreaField({ label, name, ...rest }: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <textarea id={name} name={name} className={`${controlClass} min-h-20 resize-y`} {...rest} />
    </div>
  );
}
