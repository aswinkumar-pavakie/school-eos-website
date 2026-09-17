"use client";

// Same auto-submit convention as @/components/dashboard/AutoSubmitFilter's
// AutoSubmitSelect, for the one checkbox filter the design has ("Available
// only" on Books) -- toggling it resubmits the enclosing GET form immediately,
// no separate "Filter" button needed.
import type { ComponentProps } from "react";

export function AutoSubmitCheckbox(props: ComponentProps<"input">) {
  return (
    <input
      {...props}
      type="checkbox"
      onChange={(e) => {
        props.onChange?.(e);
        e.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
