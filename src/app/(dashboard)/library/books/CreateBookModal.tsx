"use client";

// Pixel-rebuilt "Add book" modal (brain/SIS LIBRARY/School Library
// Module.dc.html's own addBookOpen overlay, 860px). Three of the design's
// fields have no real backing at all and are dropped, not faked: Grade band
// (no such column on library_book), Total copies / Copies on shelf / Price
// per copy (those are per-COPY facts in the real schema -- library_book_copy
// has its own copyCode/acquisitionCostPaise -- set via "Add copy" on the
// book's own detail page, which this modal only creates the title for) and
// Rack (also a per-copy fact -- library_book_copy.shelfLocation). Accession /
// QR code is the same per-copy story, not a book-level field. What's left
// (Title/Author/Edition/ISBN/Publisher/Subject) is exactly what
// createBookAction already accepts.
//
// Calls createBookAction directly from a plain async handler (not
// useActionState+useEffect) -- same pattern as HomeworkFormModal, avoids a
// set-state-in-effect lint violation for the close-on-success behavior.

import { useState, type InputHTMLAttributes } from "react";
import { createBookAction } from "./actions";
import { LibraryModal } from "@/components/library-ui/Modal";
import { SecondaryButton } from "@/components/library-ui/primitives";
import { useLibraryToast } from "@/components/library-ui/toast/ToastProvider";
import type { LibraryCategory } from "@/lib/library-api";

function Field({ label, name, ...rest }: { label: string; name: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label htmlFor={name} style={{ font: "600 14px/1.2 var(--lib-font-sans)", color: "var(--lib-primary)" }}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...rest}
        style={{ padding: "13px 15px", border: "1px solid var(--lib-field-border)", borderRadius: 10, font: "400 15px/1.2 var(--lib-font-sans)" }}
      />
    </div>
  );
}

export function CreateBookModal({ categories }: { categories: LibraryCategory[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const toast = useLibraryToast();
  const activeCategories = categories.filter((c) => c.status === "ACTIVE");

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);
    const result = await createBookAction({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.show("Book added");
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lib-btn-primary"
        style={{ padding: "14px 24px", border: 0, borderRadius: "var(--lib-radius-btn)", background: "var(--lib-navy)", color: "#fff", font: "600 16px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
      >
        + Add book
      </button>

      <LibraryModal open={open} onClose={() => setOpen(false)} title="Add book" width={860}>
        <form action={handleSubmit} noValidate>
          {error && (
            <p role="alert" style={{ margin: "16px 28px 0", padding: "10px 14px", borderRadius: 11, background: "var(--lib-red-bg)", color: "var(--lib-red)", font: "500 14px/1.4 var(--lib-font-sans)" }}>
              {error}
            </p>
          )}
          <div style={{ padding: "26px 28px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 22 }}>
            <Field label="Title" name="title" required disabled={pending} placeholder="e.g. Wings of Fire" />
            <Field label="Author" name="author" required disabled={pending} placeholder="e.g. A. P. J. Abdul Kalam" />
            <Field label="Edition" name="edition" disabled={pending} placeholder="Optional" />
            <Field label="ISBN" name="isbn" disabled={pending} placeholder="Optional" />
            <Field label="Publisher" name="publisher" disabled={pending} placeholder="Optional" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="categoryId" style={{ font: "600 14px/1.2 var(--lib-font-sans)", color: "var(--lib-primary)" }}>
                Subject
              </label>
              <select
                id="categoryId"
                name="categoryId"
                disabled={pending}
                defaultValue=""
                style={{ padding: "13px 15px", border: "1px solid var(--lib-field-border)", borderRadius: 10, font: "400 15px/1.2 var(--lib-font-sans)", background: "var(--lib-white)" }}
              >
                <option value="">Select a subject</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "0 28px 28px" }}>
            <SecondaryButton type="button" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </SecondaryButton>
            <button
              type="submit"
              disabled={pending}
              className="lib-btn-primary"
              style={{ padding: "12px 28px", border: 0, borderRadius: 10, background: "var(--lib-primary)", color: "#fff", font: "600 15px/1.2 var(--lib-font-sans)", cursor: "pointer", opacity: pending ? 0.7 : 1 }}
            >
              {pending ? "Adding…" : "Add book"}
            </button>
          </div>
        </form>
      </LibraryModal>
    </>
  );
}
