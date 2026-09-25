// Student health lookup: search by name / admission number, open a student's health record.

import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { classLabel, searchHealthStudents, studentName } from "@/lib/health-incharge-api";

export default async function StudentHealthSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  let results = null;
  let error: string | null = null;
  if (term.length >= 2) {
    try {
      results = await searchHealthStudents(term);
    } catch (e) {
      error = e instanceof Error ? e.message : "Couldn't search.";
    }
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Student health</h1>
      <p className="mt-2 text-[15px] text-text-muted">Find a student to see or update their health record, consents and visit history.</p>

      <form className="mt-5 flex gap-3">
        <input
          name="q"
          defaultValue={term}
          placeholder="Name or admission number (at least 2 letters)"
          autoComplete="off"
          className="w-full max-w-[460px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
        />
        <button type="submit" className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white">Search</button>
      </form>

      <div className="mt-5">
        {error ? (
          <ErrorState message={error} />
        ) : results === null ? (
          <EmptyState title="Search for a student" body="Type at least two letters of their name or admission number." />
        ) : results.length === 0 ? (
          <EmptyState title="No student found" body={`Nobody matches "${term}".`} />
        ) : (
          <div className="overflow-hidden rounded-[16px] border border-border bg-surface">
            <ul className="divide-y divide-border">
              {results.map((s) => (
                <li key={s.studentId}>
                  <Link href={`/health-incharge/students/${s.studentId}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-field">
                    <span>
                      <span className="font-semibold text-text">{studentName(s)}</span>
                      <span className="block text-[12px] text-text-muted">{classLabel(s.gradeName, s.sectionName)} · {s.admissionNo}</span>
                    </span>
                    <span className="text-[13px] text-text-muted">
                      {s.hasProfile ? `Blood group ${s.bloodGroup ?? "not recorded"}` : "No health profile yet"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
