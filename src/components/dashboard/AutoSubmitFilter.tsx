"use client";

// Filter-row primitives that submit their enclosing GET form automatically --
// replaces the separate "Apply" button pattern used across Students/Faculty/
// Parents/Finance: a select change (or a debounced pause in typing) submits the
// form itself, matching a plain uncontrolled <select>/<input> in every other way
// so these drop into an existing server-rendered <form action="..."> unchanged.

import { useRef, type ChangeEvent, type ComponentProps } from "react";

export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => {
        props.onChange?.(e);
        e.currentTarget.form?.requestSubmit();
      }}
    />
  );
}

export function AutoSubmitSearchInput(props: ComponentProps<"input">) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <input
      {...props}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        props.onChange?.(e);
        const form = e.currentTarget.form;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => form?.requestSubmit(), 450);
      }}
    />
  );
}
