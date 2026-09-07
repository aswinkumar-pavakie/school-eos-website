import { apiFetch } from "@/lib/api";

/**
 * Loops a paginated list endpoint (page/limit + {data, meta:{total}}) until
 * every matching row has been collected, for bulk print views where "print
 * everyone this filter matches" has to mean everyone, not just the first 200
 * (the per-request page-size cap every list endpoint enforces). Stops at
 * safetyCap regardless, so a mistaken/huge filter can't make a print page
 * fetch forever.
 */
export async function fetchAllPages<T>(
  basePath: string,
  query: URLSearchParams,
  options: { pageSize?: number; safetyCap?: number } = {},
): Promise<{ rows: T[]; total: number; truncated: boolean }> {
  const pageSize = options.pageSize ?? 200;
  const safetyCap = options.safetyCap ?? 2000;

  const rows: T[] = [];
  let total = 0;
  let page = 1;

  while (rows.length < safetyCap) {
    const pageQuery = new URLSearchParams(query);
    pageQuery.set("limit", String(pageSize));
    pageQuery.set("page", String(page));

    const res = await apiFetch(`${basePath}?${pageQuery.toString()}`);
    if (!res.ok) break;

    const body = (await res.json()) as { data: T[]; meta: { total: number } };
    rows.push(...body.data);
    total = body.meta.total;

    if (body.data.length < pageSize || rows.length >= total) break;
    page += 1;
  }

  return { rows, total, truncated: rows.length < total };
}
