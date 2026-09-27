// Infirmary visits: filter, record, update, notify guardians, log a contact.

import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { LogContactModal, NotifyParentButton, RecordVisitModal, UpdateVisitModal } from "@/components/health-incharge/HealthForms";
import { formatDateTime } from "@/lib/format";
import { ACTION_LABEL, SERIOUS_ACTIONS, VISIT_ACTIONS, classLabel, listHealthVisits, studentName } from "@/lib/health-incharge-api";

const input = "rounded-[11px] border border-border bg-field px-3 py-2 text-sm text-text outline-none focus:border-primary";

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; from?: string; to?: string; notice?: string }>;
}) {
  const p = await searchParams;
  let visits;
  try {
    visits = await listHealthVisits({ action: p.action, from: p.from, to: p.to, needsParentNotice: p.notice === "1" });
  } catch (e) {
    return <ErrorState message={e instanceof Error ? e.message : "Couldn't load visits."} />;
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Infirmary visits</h1>
          <p className="mt-2 text-[15px] text-text-muted">
            {visits.length} visit{visits.length === 1 ? "" : "s"}
            {p.notice === "1" ? " where guardians still need to be informed" : ""}
          </p>
        </div>
        <RecordVisitModal />
      </div>

      <form className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">
          Action
          <select name="action" defaultValue={p.action ?? ""} className={input}>
            <option value="">All</option>
            {VISIT_ACTIONS.map((a) => (<option key={a} value={a}>{ACTION_LABEL[a]}</option>))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">
          From<input type="date" name="from" defaultValue={p.from ?? ""} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">
          To<input type="date" name="to" defaultValue={p.to ?? ""} className={input} />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-text">
          <input type="checkbox" name="notice" value="1" defaultChecked={p.notice === "1"} /> Guardians not informed
        </label>
        <button type="submit" className="rounded-[11px] bg-primary px-4 py-2 text-sm font-bold text-white">Filter</button>
        <Link href="/health-incharge/visits" className="pb-2 text-sm font-semibold text-primary">Clear</Link>
      </form>

      <div className="mt-5">
        {visits.length === 0 ? (
          <EmptyState title="No visits match" body="Change the filters, or record a new visit." />
        ) : (
          <div className="overflow-x-auto rounded-[16px] border border-border bg-surface">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">
                  <th className="px-4 py-3">Student</th><th className="px-2 py-3">Complaint</th><th className="px-2 py-3">Vitals</th>
                  <th className="px-2 py-3">Action</th><th className="px-2 py-3">Guardians</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visits.map((v) => (
                  <tr key={v.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link href={`/health-incharge/students/${v.studentId}`} className="font-semibold text-text hover:text-primary">{studentName(v)}</Link>
                      <span className="block text-[12px] text-text-muted">{classLabel(v.gradeName, v.sectionName)}{v.isHosteller ? " · hosteller" : ""} · {formatDateTime(v.visitedAt)}</span>
                    </td>
                    <td className="px-2 py-3 text-text">
                      {v.complaint}
                      {v.outcome ? <span className="block text-[12px] text-text-muted">{v.outcome}</span> : null}
                    </td>
                    <td className="px-2 py-3 text-[13px] text-text-muted">
                      {v.vitals ? [v.vitals.temp_c != null && `${v.vitals.temp_c}°C`, v.vitals.pulse != null && `${v.vitals.pulse} bpm`, v.vitals.spo2 != null && `SpO₂ ${v.vitals.spo2}%`, v.vitals.bp && `BP ${v.vitals.bp}`].filter(Boolean).join(" · ") : "—"}
                    </td>
                    <td className="px-2 py-3 text-text">{ACTION_LABEL[v.action] ?? v.action}</td>
                    <td className="px-2 py-3 text-[13px]">
                      {v.parentNotifiedAt ? (
                        <span className="text-success-text">Informed {formatDateTime(v.parentNotifiedAt)}</span>
                      ) : SERIOUS_ACTIONS.includes(v.action) ? (
                        <NotifyParentButton visitId={v.id} />
                      ) : (
                        <span className="text-text-muted">Not needed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex gap-3">
                        <UpdateVisitModal visit={v} />
                        <LogContactModal visit={v} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
