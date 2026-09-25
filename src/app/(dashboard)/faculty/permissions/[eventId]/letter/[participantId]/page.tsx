// Real, digitally-signed permission letter -- GET /faculty/events/:id/
// students/:participantId/permission-letter (student-events.controller.ts),
// the exact same data source both the Faculty and Parent side already build
// their own printable letter from (see permission-letter-data.service.ts's
// own comment: "a single source of truth so the letter content can never
// drift between the two sides"). The mobile app turns this into a PDF via
// expo-print; here the browser's native print-to-PDF is the equivalent --
// no new PDF library needed, matching that same design intent.

import { redirect } from "next/navigation";
import { BackButton } from "@/components/faculty-ui/BackButton";
import { ErrorState } from "@/components/ui/EmptyState";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getPermissionLetter } from "@/lib/faculty-permissions-api";
import { PrintButton } from "../../../PrintButton";

export default async function PermissionLetterPage({
  params,
}: {
  params: Promise<{ eventId: string; participantId: string }>;
}) {
  try {
    const { eventId, participantId } = await params;
    const letter = await getPermissionLetter(eventId, participantId).catch(() => null);

    if (!letter) {
      return (
        <div>
          <BackButton href={`/faculty/permissions?eventId=${eventId}`} label="Back to request" />
          <div style={{ marginTop: 18 }}>
            <FacultyEmptyState message="This permission letter isn't available yet -- it's ready once the parent has signed or declined." />
          </div>
        </div>
      );
    }

    const approved = letter.state === "APPROVED";

    return (
      <div>
        <style>{`
          @media print {
            .faculty-scope aside, .faculty-scope header, .no-print { display: none !important; }
            .faculty-scope main { padding: 0 !important; max-width: none !important; }
          }
        `}</style>
        <div className="flex items-center justify-between gap-4 no-print">
          <BackButton href={`/faculty/permissions?eventId=${eventId}`} label="Back to request" />
          <PrintButton />
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "36px 40px", marginTop: 18, maxWidth: 720 }}>
          {letter.school && (
            <div style={{ textAlign: "center", borderBottom: "2px solid var(--fac-navy)", paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ font: "700 22px/1.2 var(--fac-font-sans)", color: "var(--fac-navy)" }}>{letter.school.name}</div>
              <div style={{ font: "400 12.5px/1.5 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 4 }}>
                {[letter.school.addressLine1, letter.school.addressLine2, letter.school.city, letter.school.district, letter.school.state, letter.school.pincode].filter(Boolean).join(", ")}
              </div>
              <div style={{ font: "400 12px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>
                {[letter.school.board, letter.school.recognitionNo ? `Recognition No. ${letter.school.recognitionNo}` : null, letter.school.contactPhone, letter.school.contactEmail].filter(Boolean).join(" · ")}
              </div>
            </div>
          )}

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ font: "700 18px/1.2 var(--fac-font-sans)" }}>Parental Consent / Permission Letter</div>
            <div
              style={{
                display: "inline-block",
                marginTop: 10,
                font: "700 12px/1 var(--fac-font-sans)",
                letterSpacing: ".06em",
                borderRadius: 20,
                padding: "7px 16px",
                background: approved ? "var(--fac-tint)" : "var(--fac-red-bg)",
                color: approved ? "var(--fac-primary)" : "var(--fac-red)",
              }}
            >
              {approved ? "APPROVED & DIGITALLY SIGNED" : "DECLINED"}
              {letter.decidedAt ? ` · ${new Date(letter.decidedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : ""}
            </div>
          </div>

          <p style={{ font: "400 14.5px/1.7 var(--fac-font-sans)", color: "var(--fac-body)" }}>
            This is to certify that <strong>{letter.student.name}</strong> (Admission No. {letter.student.admissionNo}
            {letter.student.rollNo ? `, Roll No. ${letter.student.rollNo}` : ""}
            {letter.student.gradeName && letter.student.sectionName ? `, Class ${letter.student.gradeName}-${letter.student.sectionName}` : ""}) has parental
            consent to participate in <strong>{letter.event.name}</strong> at <strong>{letter.event.location}</strong>, from{" "}
            {new Date(letter.event.startsAt).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })} to{" "}
            {new Date(letter.event.endsAt).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}.
          </p>
          <p style={{ font: "400 14.5px/1.7 var(--fac-font-sans)", color: "var(--fac-body)" }}>Purpose: {letter.event.purpose}</p>

          <div className="grid grid-cols-2 gap-4" style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--fac-divider)" }}>
            <div>
              <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)" }}>MONITORING TEACHER</div>
              <div style={{ font: "600 14px/1.4 var(--fac-font-sans)", marginTop: 6 }}>
                {letter.monitoringTeacher.name}{letter.monitoringTeacher.designation ? ` · ${letter.monitoringTeacher.designation}` : ""}
              </div>
            </div>
            <div>
              <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)" }}>CLASS TEACHER</div>
              <div style={{ font: "600 14px/1.4 var(--fac-font-sans)", marginTop: 6 }}>{letter.classTeacherName ?? "--"}</div>
            </div>
            <div>
              <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)" }}>PARENT / GUARDIAN</div>
              <div style={{ font: "600 14px/1.4 var(--fac-font-sans)", marginTop: 6 }}>{letter.parent.name ?? "--"}</div>
              <div style={{ font: "400 12.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>
                {[letter.parent.addressLine1, letter.parent.addressLine2, letter.parent.city, letter.parent.state, letter.parent.pincode].filter(Boolean).join(", ") || "--"}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--fac-divider)" }}>
            <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)" }}>PARENT&rsquo;S DIGITAL SIGNATURE</div>
            {letter.signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={letter.signatureUrl} alt="Parent signature" style={{ maxWidth: 260, marginTop: 10, border: "1px solid var(--fac-border)", borderRadius: 8, padding: 8, background: "#fff" }} />
            ) : (
              <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 8 }}>No signature on file.</p>
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
