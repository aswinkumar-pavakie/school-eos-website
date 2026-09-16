"use client";

// Reskinned to the rebuild's tokens; field labels reuse the design's own
// per-copy vocabulary ("Accession / QR code", "Rack", "Price per copy") --
// see this folder's page.tsx comment for why this screen has no design
// source of its own.

import { useState, type InputHTMLAttributes } from "react";
import { createCopyAction } from "../actions";
import { LibraryModal } from "@/components/library-ui/Modal";
import { SecondaryButton } from "@/components/library-ui/primitives";
import { useLibraryToast } from "@/components/library-ui/toast/ToastProvider";

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

export function AddCopyModal({ bookId }: { bookId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const toast = useLibraryToast();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);
    // The form collects rupees (matching the design's "₹" labelling
    // convention, e.g. Settings' own "Fine per day (₹)") but the real
    // backend field is acquisitionCostPaise -- converted here the same way
    // ConfigurationForm's own updateLibraryConfigAction converts
    // finePerDayRupees, so a real price never lands in the DB 100x too small.
    const rupees = formData.get("acquisitionCostRupees");
    if (rupees) formData.set("acquisitionCostPaise", String(Math.round(Number(rupees) * 100)));
    const result = await createCopyAction(bookId, {}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.show("Copy added");
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lib-btn-primary"
        style={{ padding: "10px 20px", border: 0, borderRadius: 9, background: "var(--lib-primary)", color: "#fff", font: "600 14px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
      >
        + Add copy
      </button>

      <LibraryModal open={open} onClose={() => setOpen(false)} title="Add a copy" width={480}>
        <form action={handleSubmit} noValidate style={{ padding: "22px 28px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
          {error && (
            <p role="alert" style={{ padding: "10px 14px", borderRadius: 11, background: "var(--lib-red-bg)", color: "var(--lib-red)", font: "500 14px/1.4 var(--lib-font-sans)" }}>
              {error}
            </p>
          )}
          <Field label="Accession / QR code" name="copyCode" required disabled={pending} placeholder="e.g. PPS-EN-0142" />
          <Field label="Rack" name="shelfLocation" disabled={pending} placeholder="e.g. RACK-G1" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Field label="Acquisition date" name="acquisitionDate" type="date" disabled={pending} />
            <Field label="Price per copy (₹)" name="acquisitionCostRupees" type="number" step="0.01" min={0} disabled={pending} placeholder="Optional" />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="lib-btn-primary"
            style={{ marginTop: 4, padding: "12px 28px", border: 0, borderRadius: 10, background: "var(--lib-primary)", color: "#fff", font: "600 15px/1.2 var(--lib-font-sans)", cursor: "pointer", opacity: pending ? 0.7 : 1 }}
          >
            {pending ? "Adding…" : "Add copy"}
          </button>
        </form>
      </LibraryModal>
    </>
  );
}
