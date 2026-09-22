"use server";

// Real inventory CRUD -- backs the Inventory screen's Add/Edit/Delete
// product actions. Multipart (image is optional) goes straight through
// apiFetch with a FormData body, same pattern as photo-actions.ts's own
// uploadPersonPhotoAction (Server Actions run server-side, so apiFetch's
// cookie-based auth already applies -- no /api proxy route needed).

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface ProductFormState {
  error?: string;
}

function extractError(body: unknown, fallback: string): string {
  const message = (body as { message?: string | string[] } | null)?.message;
  return Array.isArray(message) ? message.join(" ") : (message ?? fallback);
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const quantity = String(formData.get("quantity") ?? "");
  const pricePerUnitPaise = String(formData.get("pricePerUnitPaise") ?? "");
  if (!name) return { error: "Product name is required." };

  const body = new FormData();
  body.set("name", name);
  body.set("quantity", quantity);
  body.set("pricePerUnitPaise", pricePerUnitPaise);
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) body.set("image", image);

  const res = await apiFetch("/canteen/products", { method: "POST", body });
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    return { error: extractError(errBody, "Couldn't add that product. Nothing was changed.") };
  }
  revalidatePath("/canteen/inventory");
  revalidatePath("/canteen");
  revalidatePath("/canteen/ledger");
  return {};
}

export async function updateProductAction(
  productId: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Product name is required." };

  const body = new FormData();
  body.set("name", name);
  body.set("quantity", String(formData.get("quantity") ?? ""));
  body.set("pricePerUnitPaise", String(formData.get("pricePerUnitPaise") ?? ""));
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    body.set("image", image);
  } else if (formData.get("removeImage") === "true") {
    body.set("removeImage", "true");
  }

  const res = await apiFetch(`/canteen/products/${productId}`, { method: "PATCH", body });
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    return { error: extractError(errBody, "Couldn't update that product. Nothing was changed.") };
  }
  revalidatePath("/canteen/inventory");
  revalidatePath("/canteen");
  revalidatePath("/canteen/ledger");
  return {};
}

export async function deleteProductAction(productId: string): Promise<void> {
  const res = await apiFetch(`/canteen/products/${productId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Couldn't delete that product. Nothing was changed.");
  revalidatePath("/canteen/inventory");
  revalidatePath("/canteen");
  revalidatePath("/canteen/ledger");
}

