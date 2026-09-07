import Link from "next/link";
import { CategoriesPanel, type Category } from "@/components/inventory/CategoriesPanel";
import { apiFetch } from "@/lib/api";

export default async function InventoryCategoriesPage() {
  const res = await apiFetch("/inventory-categories");

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load categories</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: categories } = (await res.json()) as { data: Category[] };

  return (
    <div className="mx-auto max-w-[1280px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Inventory</h1>
      <p className="mt-1 text-sm text-text-muted">Configurable categories used across every inventory item.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border">
        <Link
          href="/admin/inventory"
          className="whitespace-nowrap border-b-2 border-transparent px-1 pb-2 text-[13px] font-semibold text-text-muted hover:text-text"
        >
          Items
        </Link>
        <Link
          href="/admin/inventory/categories"
          className="whitespace-nowrap border-b-2 border-primary px-1 pb-2 text-[13px] font-semibold text-primary"
        >
          Categories
        </Link>
      </div>

      <div className="mt-5 rounded-[16px] border border-border bg-surface p-[18px]">
        <CategoriesPanel categories={categories} />
      </div>
    </div>
  );
}
