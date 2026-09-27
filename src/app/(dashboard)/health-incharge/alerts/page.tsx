// Health alerts (raised by the system): review and acknowledge.

import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AcknowledgeAlertButton } from "@/components/health-incharge/HealthForms";
import { formatDateTime } from "@/lib/format";
import { ALERT_LABEL, listHealthAlerts, studentName } from "@/lib/health-incharge-api";

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const tab: "open" | "done" = status === "done" ? "done" : "open";
  let alerts;
  try {
    alerts = await listHealthAlerts(tab);
  } catch (e) {
    return <ErrorState message={e instanceof Error ? e.message : "Couldn't load alerts."} />;
  }

  const tabClass = (active: boolean) =>
    `rounded-[10px] border px-5 py-2.5 text-sm font-semibold ${active ? "border-[#0f2342] bg-[#0f2342] text-white" : "border-border bg-surface text-text hover:bg-bg"}`;

  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Health alerts</h1>
      <p className="mt-2 text-[15px] text-text-muted">Raised automatically (allergy risks, missed medication, infection clusters…). Acknowledge each once you have looked into it.</p>

      <div className="mt-5 flex gap-2.5">
        <Link href="/health-incharge/alerts" className={tabClass(tab === "open")}>Open</Link>
        <Link href="/health-incharge/alerts?status=done" className={tabClass(tab === "done")}>Acknowledged</Link>
      </div>

      <div className="mt-5">
        {alerts.length === 0 ? (
          <EmptyState title={tab === "open" ? "No open alerts" : "Nothing acknowledged yet"} body={tab === "open" ? "Nothing is waiting for you." : "Acknowledged alerts appear here."} />
        ) : (
          <ul className="divide-y divide-border rounded-[16px] border border-border bg-surface">
            {alerts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm">
                <span>
                  <span className="font-semibold text-text">{ALERT_LABEL[a.alertType] ?? a.alertType}</span>
                  <span className="block text-[12px] text-text-muted">
                    {a.studentFirstName ? (
                      <Link href={`/health-incharge/students/${a.studentId}`} className="hover:text-primary">{studentName(a)}</Link>
                    ) : (
                      (a.scopeType ?? "School-wide")
                    )}{" "}
                    · detected {formatDateTime(a.detectedAt)}
                  </span>
                </span>
                {a.acknowledgedAt ? (
                  <span className="text-[12px] text-text-muted">
                    Acknowledged {formatDateTime(a.acknowledgedAt)}
                    {a.acknowledgedByFirstName ? ` by ${[a.acknowledgedByFirstName, a.acknowledgedByLastName].filter(Boolean).join(" ")}` : ""}
                  </span>
                ) : (
                  <AcknowledgeAlertButton alertId={a.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
