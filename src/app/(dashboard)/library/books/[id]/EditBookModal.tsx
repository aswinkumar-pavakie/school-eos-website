"use client";

// Pixel-rebuilt "Edit book" modal -- same field set as CreateBookModal (see
// its own comment for why the design's per-copy fields -- accession, grade
// band, rack, total/available copies -- are dropped here too, not faked).

import { useState, type InputHTMLAttributes } from "react";
import { updateBookAction } from "../actions";
import { LibraryModal } from "@/components/library-ui/Modal";
import { SecondaryButton } from "@/components/library-ui/primitives";
import { useLibraryToast } from "@/components/library-ui/toast/ToastProvider";
import type { Book, LibraryCategory } from "@/lib/library-api";

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

export function EditBookModal({ book, categories }: { book: Book; categories: LibraryCategory[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const toast = useLibraryToast();
  const activeCategories = categories.filter((c) => c.status === "ACTIVE" || c.id === book.categoryId);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);
    const result = await updateBookAction(book.id, {}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.show("Book updated");
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lib-surface-hover"
        style={{ padding: "10px 20px", border: "1px solid var(--lib-border)", borderRadius: 9, background: "var(--lib-white)", color: "var(--lib-ink)", font: "500 14px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
      >
        Edit
      </button>

      <LibraryModal open={open} onClose={() => setOpen(false)} title="Edit book" width={860}>
        <form action={handleSubmit} noValidate>
          {error && (
            <p role="alert" style={{ margin: "16px 28px 0", padding: "10px 14px", borderRadius: 11, background: "var(--lib-red-bg)", color: "var(--lib-red)", font: "500 14px/1.4 var(--lib-font-sans)" }}>
              {error}
            </p>
          )}
          <div style={{ padding: "26px 28px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 22 }}>
            <Field label="Title" name="title" required disabled={pending} defaultValue={book.title} />
            <Field label="Author" name="author" required disabled={pending} defaultValue={book.author} />
            <Field label="Edition" name="edition" disabled={pending} defaultValue={book.edition ?? ""} />
            <Field label="ISBN" name="isbn" disabled={pending} defaultValue={book.isbn ?? ""} />
            <Field label="Publisher" name="publisher" disabled={pending} defaultValue={book.publisher ?? ""} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="categoryId" style={{ font: "600 14px/1.2 var(--lib-font-sans)", color: "var(--lib-primary)" }}>
                Subject
              </label>
              <select
                id="categoryId"
                name="categoryId"
                disabled={pending}
                defaultValue={book.categoryId ?? ""}
                style={{ padding: "13px 15px", border: "1px solid var(--lib-field-border)", borderRadius: 10, font: "400 15px/1.2 var(--lib-font-sans)", background: "var(--lib-white)" }}
              >
                <option value="">No subject</option>
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
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </LibraryModal>
    </>
  );
}
