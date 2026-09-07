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
      <span className="font-semibold text-text">
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
      <span className="font-semibold text-text">
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
    <form action={formAction} className="mt-3 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
      <p className="text-[13px] font-bold text-text">{title}</p>
      {error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{error}</p>}
      <div className="grid grid-cols-2 gap-3">{children}</div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface">
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {isPending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
