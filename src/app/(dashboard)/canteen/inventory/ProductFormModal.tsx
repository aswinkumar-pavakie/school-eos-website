"use client";

import { cloneElement, isValidElement, useRef, useState, type ReactElement } from "react";
import { CanteenModal } from "@/components/canteen-ui/Modal";
import { DefaultProductIcon } from "@/components/canteen-ui/DefaultProductIcon";
import type { CanteenProduct } from "@/lib/canteen-api";
import { createProductAction, updateProductAction } from "./actions";

// Exactly the 4 real inputs asked for: name, image (optional -- falls back
// to a themed default illustration, never a broken/missing thumbnail),
// quantity, price per unit (₹). Price is entered in rupees here and
// converted to paise on submit -- every money column backend-wide is
// paise (wallet.balance_paise, canteen_transaction.amount_paise), so this
// is the one place that conversion happens, not spread across callers.
export function ProductFormModal({
  product,
  trigger,
}: {
  product?: CanteenProduct;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [preview, setPreview] = useState<string | null>(product?.imageUrl ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const rupees = product ? (product.pricePerUnitPaise / 100).toFixed(2) : "";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);
    const priceRupees = parseFloat(String(formData.get("priceRupees") ?? "0")) || 0;
    formData.set("pricePerUnitPaise", String(Math.round(priceRupees * 100)));
    formData.delete("priceRupees");
    if (removeImage) formData.set("removeImage", "true");

    const result = product
      ? await updateProductAction(product.id, {}, formData)
      : await createProductAction({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
  }

  function openFresh() {
    setError(undefined);
    setRemoveImage(false);
    setPreview(product?.imageUrl ?? null);
    setOpen(true);
  }

  // Attaches onClick directly onto the trigger element itself -- no
  // wrapping <span>. A wrapper broke every trigger that relied on flex
  // layout from its own parent (e.g. the Inventory card's Edit button,
  // sized via flex:1 in a flex row) because the wrapper, not the button,
  // became the actual flex item -- confirmed live as the "shrunken Edit
  // button" bug.
  const clonedTrigger = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<{ onClick?: () => void }>, { onClick: openFresh })
    : trigger;

  return (
    <>
      {clonedTrigger}
      <CanteenModal open={open} onClose={() => setOpen(false)} title={product ? "Edit product" : "Add product"} width={480}>
        <form action={handleSubmit} style={{ marginTop: 4 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", margin: "16px 0" }}>
            <div
              className="can-photo-drop"
              onClick={() => fileRef.current?.click()}
              style={{
                width: 96,
                height: 96,
                borderRadius: 16,
                border: "1.5px dashed var(--can-border-hover)",
                background: preview ? "var(--can-panel)" : "linear-gradient(135deg, var(--can-tint) 0%, var(--can-tint-2) 100%)",
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- transient client-side preview (data URL or an already-hosted Supabase URL), not a Next-optimizable static asset
                <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <DefaultProductIcon size={40} />
              )}
              <span className="can-photo-overlay">{preview ? "Change photo" : "Add photo"}</span>
            </div>
            <div style={{ flex: 1 }}>
              <input ref={fileRef} type="file" name="image" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{ display: "none" }} />
              <p style={{ margin: 0, font: "600 13.5px/1.4 var(--can-font-sans)", color: "var(--can-ink)" }}>Product photo</p>
              <p style={{ margin: "4px 0 0", font: "400 12.5px/1.5 var(--can-font-sans)", color: "var(--can-tertiary)" }}>
                Optional -- click the box to upload. A default illustration is used if you skip this.
              </p>
              {preview && (
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setRemoveImage(true);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  style={{ marginTop: 8, border: 0, background: "none", cursor: "pointer", font: "600 12.5px/1 var(--can-font-sans)", color: "var(--can-red-text)", padding: 0 }}
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div style={{ font: "600 11px/1 var(--can-font-sans)", letterSpacing: ".09em", color: "var(--can-tertiary)", margin: "16px 0 8px" }}>PRODUCT NAME</div>
          <input
            name="name"
            defaultValue={product?.name}
            required
            placeholder="e.g. Samosa"
            style={{ width: "100%", border: "1px solid var(--can-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--can-font-sans)" }}
          />

          <div className="flex gap-3" style={{ marginTop: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ font: "600 11px/1 var(--can-font-sans)", letterSpacing: ".09em", color: "var(--can-tertiary)", marginBottom: 8 }}>QUANTITY IN STOCK</div>
              <input
                name="quantity"
                type="number"
                min={0}
                step={1}
                defaultValue={product?.quantity ?? 0}
                required
                style={{ width: "100%", border: "1px solid var(--can-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--can-font-sans)" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: "600 11px/1 var(--can-font-sans)", letterSpacing: ".09em", color: "var(--can-tertiary)", marginBottom: 8 }}>PRICE PER UNIT (₹)</div>
              <div className="flex items-center gap-2" style={{ border: "1px solid var(--can-border)", borderRadius: 10, padding: "0 14px" }}>
                <span style={{ font: "700 14px/1 var(--can-font-sans)", color: "var(--can-body-muted)" }}>₹</span>
                <input
                  name="priceRupees"
                  type="number"
                  min={0}
                  step={0.5}
                  defaultValue={rupees}
                  required
                  style={{ width: "100%", border: 0, background: "none", padding: "13px 0", font: "400 14.5px/1 var(--can-font-sans)", outline: "none" }}
                />
              </div>
            </div>
          </div>

          {error && <p style={{ font: "400 12.5px/1.4 var(--can-font-sans)", color: "var(--can-red-text)", marginTop: 12 }}>{error}</p>}

          <button
            type="submit"
            disabled={pending}
            style={{
              width: "100%",
              marginTop: 22,
              border: 0,
              cursor: pending ? "not-allowed" : "pointer",
              borderRadius: 11,
              padding: 14,
              font: "600 15px/1 var(--can-font-sans)",
              color: "#fff",
              background: "var(--can-gradient-accent)",
              boxShadow: pending ? "none" : "0 4px 14px rgba(29,78,216,.28)",
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? "Saving…" : product ? "Save changes" : "Add product"}
          </button>
        </form>
      </CanteenModal>
    </>
  );
}
