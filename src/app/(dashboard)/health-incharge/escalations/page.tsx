// Parent & doctor contacts logged about infirmary visits (read here; log one from a visit row).

import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/format";
import { listHealthEscalations, studentName } from "@/lib/health-incharge-api";

export default async function EscalationsPage() {
  let rows;
  try {
    rows = await listHealthEscalations();
  } catch (e) {
    return <ErrorState message={e instanceof Error ? e.message : "Couldn't load contacts."} />;
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Parent &amp; doctor contacts</h1>
      <p className="mt-2 text-[15px] text-text-muted">
        Every call or message made about a student&apos;s infirmary visit. To log a new one, use <strong>Log contact</strong> on the visit in{" "}
        <Link href="/health-incharge/visits" className="font-semibold text-primary">Infirmary visits</Link>.
      </p>

      <div className="mt-5">
        {rows.length === 0 ? (
          <EmptyState title="No contacts logged" body="Contacts you log appear here." />
        ) : (
          <div className="overflow-x-auto rounded-[16px] border border-border bg-surface">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">
                  <th className="px-4 py-3">Student</th><th className="px-2 py-3">#</th><th className="px-2 py-3">Contacted</th>
                  <th className="px-2 py-3">Channel</th><th className="px-2 py-3">Response / outcome</th><th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="px-4 py-3 font-semibold text-text">
                      <Link href={`/health-incharge/students/${e.studentId}`} className="hover:text-primary">{studentName(e)}</Link>
                    </td>
                    <td className="px-2 py-3 text-text-muted">{e.sequenceNo}</td>
                    <td className="px-2 py-3 text-text">{e.contactedName ?? "—"}</td>
                    <td className="px-2 py-3 text-text-muted">{e.channel?.replace("_", " ").toLowerCase() ?? "—"}</td>
                    <td className="px-2 py-3 text-text">
                      {e.response ?? "—"}
                      {e.outcome ? <span className="block text-[12px] text-text-muted">{e.outcome}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-muted">{formatDateTime(e.contactedAt)}</td>
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
