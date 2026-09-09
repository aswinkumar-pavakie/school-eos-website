"use client";

export function ReportsFilterBar({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  return (
    <form action="/transport-manager/reports" className="mt-6 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">From</span>
        <input
          type="date"
          name="dateFrom"
          defaultValue={dateFrom}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">To</span>
        <input
          type="date"
          name="dateTo"
          defaultValue={dateTo}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        />
      </label>
      <button type="submit" className="rounded-[11px] bg-primary px-3.5 py-2.5 text-sm font-bold text-white">
        Apply
      </button>
    </form>
  );
}
