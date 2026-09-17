"use client";

// Search + category filter + club card grid -- pixel-matched to the
// reference's own isCommunityList markup (search input, category select,
// "CLUBS · N of M" count, card grid with category badge/member count/name/
// description/advisor/post count). Client-side filtering over the real,
// small club dataset the server component already fetched -- same "no extra
// round trip for a handful of rows" reasoning the rest of this app uses for
// small tables.

import Link from "next/link";
import { useMemo, useState } from "react";

export interface ClubRow {
  id: string;
  name: string;
  category: string;
  description: string;
  advisor: string;
  memberCount: number;
  postCount: number;
}

export function CommunityListClient({ clubs }: { clubs: ClubRow[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const categories = useMemo(() => {
    const set = new Set(clubs.map((c) => c.category).filter(Boolean));
    return ["All categories", ...Array.from(set).sort()];
  }, [clubs]);

  const filtered = clubs.filter((c) => {
    if (category && category !== "All categories" && c.category !== category) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return c.name.toLowerCase().includes(q) || c.advisor.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clubs by name or teacher in-charge"
          className="min-w-[220px] flex-1 rounded-[9px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:shadow-[0_0_0_3px_#e7eeff]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-[9px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
        >
          {categories.map((c) => (
            <option key={c} value={c === "All categories" ? "" : c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 mt-5 text-[12px] font-bold uppercase tracking-[0.09em] text-text-muted">
        CLUBS · {filtered.length} of {clubs.length}
      </div>

      {filtered.length === 0 && (
        <p className="py-5 text-[13.5px] text-text-muted">No clubs match your search or filter.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/admin/community/${c.id}`}
            className="card-hover rounded-[14px] border border-border bg-surface p-[20px_22px]"
          >
            <div className="flex items-start justify-between gap-2.5">
              <span className="rounded-[6px] bg-primary/10 px-2 py-[3px] text-[11px] font-bold tracking-[0.02em] text-primary">
                {c.category}
              </span>
              <span className="whitespace-nowrap text-[12.5px] text-text-muted">
                {c.memberCount} member{c.memberCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-3 text-[19px] font-bold text-text">{c.name}</div>
            <div className="mt-1.5 text-sm leading-[1.55] text-text-muted">{c.description || "No description yet."}</div>
            <div className="mt-2.5 text-[12.5px] text-text-muted">Teacher in-charge · {c.advisor}</div>
            <div className="mt-2 text-[13px] font-semibold text-primary">
              {c.postCount === 0 ? "No posts yet" : `${c.postCount} post${c.postCount === 1 ? "" : "s"} to parents`}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
