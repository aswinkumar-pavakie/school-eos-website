// Shared plain-input/select/textarea primitives -- same field rhythm as
// CreateStudentModal's and Transport's own local Field/SelectField, just shared
// here since Inventory and Maintenance are two new, closely-related features
// that would otherwise each duplicate a third copy of the same thing.

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
  onChange,
  options,
}: {
  label: string;
  name: string;
  disabled?: boolean;
  required?: boolean;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
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
        onChange={onChange}
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

export function TextAreaField({
  label,
  name,
  required,
  disabled,
  placeholder,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">
        {label}
        {required && <span className="text-critical-text"> *</span>}
      </span>
      <textarea
        name={name}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        defaultValue={defaultValue}
        rows={rows}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
      />
    </label>
  );
}
