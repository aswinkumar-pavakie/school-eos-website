import type { SelectHTMLAttributes } from "react";

// Styled wrapper around a plain native <select> -- the design still uses
// native selects for simple pickers (Students filters, most forms) alongside
// CustomSelect for the richer dropdown pattern.
export function FacultySelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", style, ...rest } = props;
  return (
    <select
      className={className}
      style={{
        width: "100%",
        border: "1px solid var(--fac-border)",
        borderRadius: "var(--fac-radius-input)",
        padding: "13px 14px",
        font: "400 14.5px/1 var(--fac-font-sans)",
        background: "var(--fac-white)",
        color: "var(--fac-body)",
        ...style,
      }}
      {...rest}
    />
  );
}
