"use client";

import { useState } from "react";
import { TrashIcon } from "@/components/canteen-ui/icons";
import { deleteProductAction } from "./actions";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!confirm(`Delete "${productName}"? Past sales keep their own record, but this removes it from the catalog for good.`)) return;
    setPending(true);
    try {
      await deleteProductAction(productId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't delete that product.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title="Delete product"
      className="can-icon-btn can-icon-btn-danger flex items-center justify-center gap-1.5"
      style={{ flex: 1, border: "1px solid var(--can-border)", background: "var(--can-white)", cursor: pending ? "not-allowed" : "pointer", borderRadius: 8, padding: "9px 0", font: "600 12.5px/1 var(--can-font-sans)", color: "var(--can-body)", opacity: pending ? 0.6 : 1 }}
    >
      <TrashIcon /> {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
