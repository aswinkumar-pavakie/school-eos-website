// Real, digitally-signed permission letter -- GET /parent/permission-requests/
// :id/permission-letter (parent-permissions.controller.ts), the exact same
// data source the Faculty side already builds its own printable letter from
// (see permission-letter-data.service.ts's own comment: "a single source of
// truth so the letter content can never drift between the two sides"). The
// mobile app turns this into a PDF via expo-print; here the browser's native
// print-to-PDF is the equivalent, matching Faculty's own website letter page.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState, EmptyState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getPermissionLetter } from "@/lib/parent-api";
import { PrintButton } from "../../PrintButton";

export default async function ParentPermissionLetterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ studentId?: string }>;
}) {
  try {
    const { id } = await params;
    const { studentId } = await searchParams;
    const backHref = `/parent/permissions${studentId ? `?studentId=${studentId}&requestId=${id}` : ""}`;
    const letter = await getPermissionLetter(id).catch(() => null);

    if (!letter) {
      return (
        <div>
          <Link href={backHref} className="text-sm font-semibold text-primary hover:underline">← Back to request</Link>
          <div style={{ marginTop: 18 }}>
            <EmptyState title="Letter not ready" body="This permission letter isn't available yet -- it's ready once you've signed or declined." />
          </div>
        </div>
      );
    }

    const approved = letter.state === "APPROVED";

    return (
      <div className="parent-scope">
        <style>{`
          @media print {
            .parent-scope aside, .parent-scope header, .no-print { display: none !important; }
            .parent-scope main { padding: 0 !important; max-width: none !important; }
          }
        `}</style>
        <div className="flex items-center justify-between gap-4 no-print">
          <Link href={backHref} className="text-sm font-semibold text-primary hover:underline">← Back to request</Link>
          <PrintButton />
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card)", padding: "36px 40px", marginTop: 18, maxWidth: 720 }}>
          {letter.school && (
            <div style={{ textAlign: "center", borderBottom: "2px solid var(--par-navy)", paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ font: "700 22px/1.2 var(--par-font)", color: "var(--par-navy)" }}>{letter.school.name}</div>
              <div style={{ font: "400 12.5px/1.5 var(--par-font)", color: "var(--par-body-muted)", marginTop: 4 }}>
                {[letter.school.addressLine1, letter.school.addressLine2, letter.school.city, letter.school.district, letter.school.state, letter.school.pincode].filter(Boolean).join(", ")}
              </div>
              <div style={{ font: "400 12px/1.5 var(--par-font)", color: "var(--par-tertiary)", marginTop: 3 }}>
                {[letter.school.board, letter.school.recognitionNo ? `Recognition No. ${letter.school.recognitionNo}` : null, letter.school.contactPhone, letter.school.contactEmail].filter(Boolean).join(" · ")}
              </div>
            </div>
          )}

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ font: "700 18px/1.2 var(--par-font)" }}>Parental Consent / Permission Letter</div>
            <div
              style={{
                display: "inline-block",
                marginTop: 10,
                font: "700 12px/1 var(--par-font)",
                letterSpacing: ".06em",
                borderRadius: 20,
                padding: "7px 16px",
                background: approved ? "var(--par-tint)" : "var(--par-red-bg)",
                color: approved ? "var(--par-primary)" : "var(--par-red)",
              }}
            >
              {approved ? "APPROVED & DIGITALLY SIGNED" : "DECLINED"}
              {letter.decidedAt ? ` · ${new Date(letter.decidedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : ""}
            </div>
          </div>

          <p style={{ font: "400 14.5px/1.7 var(--par-font)", color: "var(--par-body)" }}>
            This is to certify that <strong>{letter.student.name}</strong> (Admission No. {letter.student.admissionNo}
            {letter.student.rollNo ? `, Roll No. ${letter.student.rollNo}` : ""}
            {letter.student.gradeName && letter.student.sectionName ? `, Class ${letter.student.gradeName}-${letter.student.sectionName}` : ""}) has parental
            consent to participate in <strong>{letter.event.name}</strong> at <strong>{letter.event.location}</strong>, from{" "}
            {new Date(letter.event.startsAt).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })} to{" "}
            {new Date(letter.event.endsAt).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}.
          </p>
          <p style={{ font: "400 14.5px/1.7 var(--par-font)", color: "var(--par-body)" }}>Purpose: {letter.event.purpose}</p>

          <div className="grid grid-cols-2 gap-4" style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--par-divider)" }}>
            <div>
              <div style={{ font: "600 10.5px/1 var(--par-font)", letterSpacing: ".08em", color: "var(--par-tertiary)" }}>MONITORING TEACHER</div>
              <div style={{ font: "600 14px/1.4 var(--par-font)", marginTop: 6 }}>
                {letter.monitoringTeacher.name}{letter.monitoringTeacher.designation ? ` · ${letter.monitoringTeacher.designation}` : ""}
              </div>
            </div>
            <div>
              <div style={{ font: "600 10.5px/1 var(--par-font)", letterSpacing: ".08em", color: "var(--par-tertiary)" }}>CLASS TEACHER</div>
              <div style={{ font: "600 14px/1.4 var(--par-font)", marginTop: 6 }}>{letter.classTeacherName ?? "--"}</div>
            </div>
            <div>
              <div style={{ font: "600 10.5px/1 var(--par-font)", letterSpacing: ".08em", color: "var(--par-tertiary)" }}>PARENT / GUARDIAN</div>
              <div style={{ font: "600 14px/1.4 var(--par-font)", marginTop: 6 }}>{letter.parent.name ?? "--"}</div>
              <div style={{ font: "400 12.5px/1.5 var(--par-font)", color: "var(--par-tertiary)", marginTop: 3 }}>
                {[letter.parent.addressLine1, letter.parent.addressLine2, letter.parent.city, letter.parent.state, letter.parent.pincode].filter(Boolean).join(", ") || "--"}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--par-divider)" }}>
            <div style={{ font: "600 10.5px/1 var(--par-font)", letterSpacing: ".08em", color: "var(--par-tertiary)" }}>YOUR DIGITAL SIGNATURE</div>
            {letter.signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={letter.signatureUrl} alt="Your signature" style={{ maxWidth: 260, marginTop: 10, border: "1px solid var(--par-border)", borderRadius: 8, padding: 8, background: "#fff" }} />
            ) : (
              <p style={{ font: "400 13.5px/1.5 var(--par-font)", color: "var(--par-tertiary)", marginTop: 8 }}>No signature on file.</p>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this permission letter. Nothing was changed -- try again." />;
  }
}
