"use client";

// Every Parent page is scoped to exactly one child at a time (the backend
// takes a real studentId per route, same as the mobile app's own
// useSelectedChild hook) -- here that's the `?studentId=` search param on
// whatever page is currently open, never a client-side global store (this
// app has none; Server Components are the whole architecture). Switching
// child just re-navigates the current path with a different studentId,
// which the page itself re-resolves server-side on the next render.

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { ParentChild } from "@/lib/parent-api";

export function ChildSwitcher({ students, selectedStudentId }: { students: ParentChild[]; selectedStudentId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (students.length <= 1) return null;

  function onChange(studentId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("studentId", studentId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={selectedStudentId}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-[var(--radius-input)] border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text"
      aria-label="Switch child"
    >
      {students.map((c) => (
        <option key={c.studentId} value={c.studentId}>
          {c.studentName} — {[c.gradeName, c.sectionName].filter(Boolean).join(" ")}
        </option>
      ))}
    </select>
  );
}
