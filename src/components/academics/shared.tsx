// Shared small form primitives for the Academics panels -- same local-component
// pattern CreateStudentModal.tsx established (duplicated per module rather than a
// cross-phase shared abstraction).
"use client";

export function Field({
  label,
  name,
  type = "text",
  required,
  disabled,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">
        {label}
        {required && <span className="text-critical-text"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  disabled,
  required,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  disabled?: boolean;
  required?: boolean;
  defaultValue?: string;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">
        {label}
        {required && <span className="text-critical-text"> *</span>}
      </span>
      <select
        name={name}
        disabled={disabled}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
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

// Card title + "N of these" subtitle + top-right "+ New X" action link -- the
// same header shape used across the panel's own card body (matches the
// h2/p title pattern established on admin/health's "Infirmary visits" card).
export function PanelHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  hideAction,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  hideAction?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">{title}</h2>
        <p className="mt-1 text-[13px] text-text-muted">{subtitle}</p>
      </div>
      {actionLabel && onAction && !hideAction && (
        <button type="button" onClick={onAction} className="text-[13px] font-semibold text-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function PanelCreateForm({
  title,
  children,
  onCancel,
  formAction,
  isPending,
  error,
  submitLabel,
}: {
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  error?: string;
  submitLabel: string;
}) {
  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
      <p className="text-[13px] font-bold text-text">{title}</p>
      {error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{error}</p>}
      <div className="grid grid-cols-2 gap-3">{children}</div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Same create-form shape as PanelCreateForm, but rendered as the table's own
// first <tbody> row (directly under the <thead>) instead of a block above the
// table -- matches the reference's inline add-row form for Grades/Sections/
// Subjects/Departments/Class advisors, rather than a separate floating panel.
export function PanelCreateFormRow({
  colSpan,
  children,
  onCancel,
  formAction,
  isPending,
  error,
  submitLabel = "Save changes",
}: {
  colSpan: number;
  children: React.ReactNode;
  onCancel: () => void;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  error?: string;
  submitLabel?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="pb-3 pt-2">
        <form action={formAction} className="flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
          {error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{error}</p>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isPending ? "Saving…" : submitLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
