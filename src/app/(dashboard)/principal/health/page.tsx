// Health & Infirmary -- real data throughout: health_profile, infirmary_visit,
// health_alert, medical_escalation and emergency_treatment_consent all
// already existed live in the DB (1,120 health profiles, 200 infirmary
// visits, 10 alerts, 10 escalations, 1,120 consents) with no API in front of
// them until now -- see src/modules/health's own comment. Read-only: the real
// data owner is the HEALTH_INCHARGE role (see the `role` table), which has no
// web/mobile login built yet -- a separate future build, same status as
// Faculty/Parent/Hostel Warden mobile. Recording a new visit/alert/escalation
// stays out of scope until that role has its own real login; this page is
// Principal oversight only, same real endpoint and same convention as every
// other module this session (Admin's own page at admin/health is identical).

import { KpiCard } from "@/components/dashboard/KpiCard";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatDateTime, statusLabel } from "@/lib/format";

interface InfirmaryVisitRow {
  id: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  visitedAt: string;
  complaint: string;
  observation: string | null;
  action: string;
  attendedByFirstName: string | null;
  attendedByLastName: string | null;
  outcome: string | null;
  isHosteller: boolean;
}

interface HealthAlertRow {
  id: string;
  alertType: string;
  studentFirstName: string | null;
  studentLastName: string | null;
  detectedAt: string;
  acknowledgedByFirstName: string | null;
  acknowledgedByLastName: string | null;
  acknowledgedAt: string | null;
}

interface MedicalEscalationRow {
  id: string;
  studentFirstName: string;
  studentLastName: string | null;
  sequenceNo: number;
  contactedName: string | null;
  contactedAt: string;
  channel: string | null;
  outcome: string | null;
}

const ACTION_TONE: Record<string, "success" | "pending" | "critical"> = {
  REST: "success",
  MEDICATION: "success",
  NO_ACTION: "success",
  SENT_HOME: "pending",
  SICKBAY_ADMIT: "pending",
  REFERRED: "critical",
};

export default async function PrincipalHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const sp = await searchParams;
  const query = new URLSearchParams();
  if (sp.action) query.set("action", sp.action);

  const [visitsRes, alertsRes, escalationsRes] = await Promise.all([
    apiFetch(`/health/infirmary-visits?${query.toString()}`),
    apiFetch("/health/alerts"),
    apiFetch("/health/escalations"),
  ]);
  const visits: InfirmaryVisitRow[] = visitsRes.ok ? ((await visitsRes.json()) as { data: InfirmaryVisitRow[] }).data : [];
  const alerts: HealthAlertRow[] = alertsRes.ok ? ((await alertsRes.json()) as { data: HealthAlertRow[] }).data : [];
  const escalations: MedicalEscalationRow[] = escalationsRes.ok
    ? ((await escalationsRes.json()) as { data: MedicalEscalationRow[] }).data
    : [];

  const openAlerts = alerts.filter((a) => !a.acknowledgedAt);
  const sentHomeOrReferred = visits.filter((v) => v.action === "SENT_HOME" || v.action === "REFERRED").length;

  return (
    <div className="mx-auto max-w-[1280px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Health &amp; Infirmary</h1>
      <p className="mt-1 text-sm text-text-muted">
        Infirmary visits, health alerts and medical escalations — read-only oversight, real data throughout.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard eyebrow="Infirmary visits" value={String(visits.length)} detail="Most recent 200 on file" />
        <KpiCard
          eyebrow="Open health alerts"
          value={String(openAlerts.length)}
          detail={[`of ${alerts.length} total`, `${alerts.length - openAlerts.length} already acknowledged`]}
        />
        <KpiCard
          eyebrow="Sent home / referred"
          value={String(sentHomeOrReferred)}
          detail={`of ${visits.length} visits`}
        />
        <KpiCard eyebrow="Escalations logged" value={String(escalations.length)} detail="Guardian/emergency contact attempts" />
      </div>

      <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Infirmary visits</h2>
          <form action="/principal/health" className="flex items-center gap-2">
            <AutoSubmitSelect
              name="action"
              defaultValue={sp.action ?? ""}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2 text-sm text-text outline-none focus:border-primary focus:bg-surface"
            >
              <option value="">All outcomes</option>
              {Object.keys(ACTION_TONE).map((a) => (
                <option key={a} value={a}>
                  {a.replace(/_/g, " ")}
                </option>
              ))}
            </AutoSubmitSelect>
          </form>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="py-2.5 pr-3">Student</th>
                <th className="py-2.5 pr-3">Class</th>
                <th className="py-2.5 pr-3">Visited</th>
                <th className="py-2.5 pr-3">Complaint</th>
                <th className="py-2.5 pr-3">Action</th>
                <th className="py-2.5 pr-3">Attended by</th>
                <th className="py-2.5">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visits.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-text-muted">
                    No infirmary visits match this filter.
                  </td>
                </tr>
              )}
              {visits.map((v) => (
                <tr key={v.id} className="card-hover">
                  <td className="py-3 pr-3">
                    <p className="font-semibold text-text">
                      {v.studentFirstName} {v.studentLastName ?? ""}
                    </p>
                    <p className="text-xs text-text-muted">{v.admissionNo}{v.isHosteller ? " · Hosteller" : ""}</p>
                  </td>
                  <td className="py-3 pr-3 text-text-muted">
                    {v.gradeName ? `${v.gradeName}${v.sectionName ? `-${v.sectionName}` : ""}` : "—"}
                  </td>
                  <td className="py-3 pr-3 font-mono text-text-muted">{formatDateTime(v.visitedAt)}</td>
                  <td className="py-3 pr-3 text-text">{v.complaint}</td>
                  <td className="py-3 pr-3">
                    <StatusPill tone={ACTION_TONE[v.action] ?? "pending"} label={v.action.replace(/_/g, " ")} />
                  </td>
                  <td className="py-3 pr-3 text-text-muted">
                    {v.attendedByFirstName ? `${v.attendedByFirstName} ${v.attendedByLastName ?? ""}`.trim() : "—"}
                  </td>
                  <td className="py-3 text-text-muted">{v.outcome ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <div className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Health alerts</h2>
          <p className="mt-1 text-[13px] text-text-muted">System-detected risks — allergy, missed medication, overdue follow-up.</p>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {alerts.length === 0 && <li className="py-3 text-sm text-text-muted">No health alerts on file.</li>}
            {alerts.map((a) => (
              <li key={a.id} className="card-hover flex flex-wrap items-center justify-between gap-2 rounded-[10px] px-2 py-2.5 text-[13px]">
                <div>
                  <p className="font-semibold text-text">{a.alertType.replace(/_/g, " ")}</p>
                  <p className="text-xs text-text-muted">
                    {a.studentFirstName ? `${a.studentFirstName} ${a.studentLastName ?? ""}` : "School-wide"} ·{" "}
                    {formatDateTime(a.detectedAt)}
                  </p>
                </div>
                {a.acknowledgedAt ? (
                  <StatusPill
                    tone="success"
                    label={`Acknowledged${a.acknowledgedByFirstName ? ` by ${a.acknowledgedByFirstName}` : ""}`}
                  />
                ) : (
                  <StatusPill tone="critical" label="Open" />
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Medical escalations</h2>
          <p className="mt-1 text-[13px] text-text-muted">Guardian / emergency contact attempts logged against a visit or referral.</p>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {escalations.length === 0 && <li className="py-3 text-sm text-text-muted">No escalations on file.</li>}
            {escalations.map((e) => (
              <li key={e.id} className="card-hover flex flex-wrap items-center justify-between gap-2 rounded-[10px] px-2 py-2.5 text-[13px]">
                <div>
                  <p className="font-semibold text-text">
                    {e.studentFirstName} {e.studentLastName ?? ""} · Step {e.sequenceNo}
                  </p>
                  <p className="text-xs text-text-muted">
                    {e.contactedName ?? "—"}{e.channel ? ` · ${statusLabel(e.channel)}` : ""} · {formatDateTime(e.contactedAt)}
                  </p>
                </div>
                <span className="text-xs text-text-muted">{e.outcome ?? "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
