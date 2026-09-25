// One student's health record: profile (editable), emergency consents, visit + contact history.

import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { HealthProfileForm, RecordVisitModal } from "@/components/health-incharge/HealthForms";
import { formatDate, formatDateTime } from "@/lib/format";
import { ACTION_LABEL, classLabel, getStudentHealth, studentName } from "@/lib/health-incharge-api";

export default async function StudentHealthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data;
  try {
    data = await getStudentHealth(id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/not found/i.test(msg) || /invalid|uuid/i.test(msg)) notFound();
    return <ErrorState message={msg || "Couldn't load this student."} />;
  }
  const { student, profile, consents, visits, escalations } = data;

  return (
    <div className="mx-auto max-w-[1000px]">
      <Link href="/health-incharge/students" className="text-[13px] font-semibold text-primary">← Student health</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-0.025em] text-text">{studentName(student)}</h1>
          <p className="mt-1.5 text-[15px] text-text-muted">{classLabel(student.gradeName, student.sectionName)} · Admission {student.admissionNo}</p>
        </div>
        <RecordVisitModal student={student} label="+ Record visit for this student" />
      </div>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold text-text">Health profile</h2>
        <p className="mb-4 mt-1 text-[13px] text-text-muted">
          {profile ? `Last updated ${formatDate(profile.updatedAt)}.` : "No profile recorded yet — fill it in below."}
        </p>
        <HealthProfileForm studentId={student.studentId} profile={profile} />
      </section>

      <section className="mt-5 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold text-text">Emergency treatment consents</h2>
        {consents.length === 0 ? (
          <div className="mt-3"><EmptyState title="No consent on file" body="No guardian has given emergency treatment consent." /></div>
        ) : (
          <ul className="mt-3 divide-y divide-border text-sm">
            {consents.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="font-semibold text-text">{[c.guardianFirstName, c.guardianLastName].filter(Boolean).join(" ")}</span>
                <span className="text-text-muted">{c.scope}</span>
                <span className="text-[12px] text-text-muted">given {formatDate(c.consentGivenAt)}{c.validUntil ? ` · valid until ${formatDate(c.validUntil)}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-5 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold text-text">Visit history</h2>
        {visits.length === 0 ? (
          <div className="mt-3"><EmptyState title="No visits" body="This student hasn't visited the infirmary." /></div>
        ) : (
          <ul className="mt-3 divide-y divide-border text-sm">
            {visits.map((v) => (
              <li key={v.id} className="py-2.5">
                <span className="font-semibold text-text">{v.complaint}</span>
                <span className="ml-2 text-text-muted">{ACTION_LABEL[v.action] ?? v.action}</span>
                <span className="block text-[12px] text-text-muted">
                  {formatDateTime(v.visitedAt)}{v.outcome ? ` · ${v.outcome}` : ""}
                  {v.parentNotifiedAt ? ` · guardians informed ${formatDateTime(v.parentNotifiedAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {escalations.length > 0 && (
        <section className="mt-5 rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold text-text">Contacts logged</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {escalations.map((e) => (
              <li key={e.id} className="py-2.5">
                <span className="font-semibold text-text">#{e.sequenceNo} {e.contactedName ?? "—"}</span>
                <span className="ml-2 text-text-muted">{e.channel?.replace("_", " ").toLowerCase()}</span>
                <span className="block text-[12px] text-text-muted">{formatDateTime(e.contactedAt)}{e.outcome ? ` · ${e.outcome}` : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
