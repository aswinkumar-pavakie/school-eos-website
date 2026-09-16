"use client";

// Real eBook records -- library_ebook table, no file storage at all. An
// eBook here IS a real external link (resourceUrl); "Add eBook" just records
// that link plus its display metadata, exactly how a real school library's
// own eResources register works.

import { useActionState, useRef, useState } from "react";
import { LibraryModal } from "@/components/library-ui/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/library-ui/primitives";
import type { LibraryCategory } from "@/lib/library-api";
import { createEbookAction, type FormActionState } from "./actions";

const initialState: FormActionState = {};

export function AddEbookButton({ categories }: { categories: LibraryCategory[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const [state, formAction, pending] = useActionState(async (_prev: FormActionState, formData: FormData) => {
    const result = await createEbookAction(_prev, formData);
    if (!result.error) {
      formRef.current?.reset();
      setOpen(false);
    }
    return result;
  }, initialState);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lib-btn-primary"
        style={{ padding: "14px 24px", border: 0, borderRadius: "var(--lib-radius-btn)", background: "var(--lib-navy)", color: "#fff", font: "600 16px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
      >
        + Add eBook
      </button>
      <LibraryModal open={open} onClose={() => setOpen(false)} title="Add eBook" width={520}>
        <form ref={formRef} action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 28px 8px" }}>
          {state.error && (
            <p role="alert" style={{ margin: 0, padding: "10px 14px", borderRadius: 11, background: "var(--lib-red-bg)", color: "var(--lib-red)", font: "500 14px/1.4 var(--lib-font-sans)" }}>
              {state.error}
            </p>
          )}
          <label style={{ display: "flex", flexDirection: "column", gap: 6, font: "500 14px/1.3 var(--lib-font-sans)" }}>
            Title *
            <input name="title" required style={{ border: "1px solid var(--lib-border)", borderRadius: 10, padding: "10px 12px", font: "400 14px/1.3 var(--lib-font-sans)" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, font: "500 14px/1.3 var(--lib-font-sans)" }}>
            Resource link *
            <input name="resourceUrl" type="url" required placeholder="https://…" style={{ border: "1px solid var(--lib-border)", borderRadius: 10, padding: "10px 12px", font: "400 14px/1.3 var(--lib-font-sans)" }} />
          </label>
          <div style={{ font: "400 12.5px/1.4 var(--lib-font-sans)", color: "var(--lib-tertiary)", marginTop: -8 }}>
            The real, official link for this resource — opening it takes the reader straight there.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, font: "500 14px/1.3 var(--lib-font-sans)" }}>
              Author
              <input name="author" style={{ border: "1px solid var(--lib-border)", borderRadius: 10, padding: "10px 12px", font: "400 14px/1.3 var(--lib-font-sans)" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, font: "500 14px/1.3 var(--lib-font-sans)" }}>
              Subject
              <select name="categoryId" style={{ border: "1px solid var(--lib-border)", borderRadius: 10, padding: "10px 12px", font: "400 14px/1.3 var(--lib-font-sans)" }}>
                <option value="">Unassigned</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 10 }}>
            <SecondaryButton type="button" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={pending}>
              {pending ? "Saving…" : "Add"}
            </PrimaryButton>
          </div>
        </form>
      </LibraryModal>
    </>
  );
}
