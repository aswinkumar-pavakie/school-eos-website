// Principal's Parent profile -- read-only oversight, reusing Admin's real data
// (same GET /parents/:id) and design language. Deliberately excludes every
// writable piece of Admin's own profile page: the editable contact form, login
// security actions (reset password), photo editor, per-child occupation edit,
// and the activate/deactivate account action -- Principal views, never edits.
// Linked-child names route to Principal's own /principal/students/[id]
// (Phase 2), never /admin/students.

import { notFound } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/dashboard/BackLink";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import { ProfileHeader, type ProfilePill, type ProfileStat } from "@/components/dashboard/ProfileHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatMoneySummary } from "@/lib/format";

interface ChildLink {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  studentAdmissionNo: string;
  studentPhotoUrl: string | null;
  gradeName: string | null;
  sectionName: string | null;
  relationship: string;
  isPrimaryContact: boolean;
  isAuthorisedPickup: boolean;
  occupation: string | null;
  annualIncomePaise: string | null;
  status: string;
}

interface LoginIdentifier {
  identifierType: string;
  value: string;
  isVerified: boolean;
}

interface ParentDetail {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  mobile: string | null;
  status: string;
  photoUrl: string | null;
  children: ChildLink[];
  loginIdentifiers: LoginIdentifier[];
}

function statusTone(status: string): "success" | "pending" | "critical" {
  return status === "ACTIVE" ? "success" : "critical";
}

export default async function PrincipalParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const res = await apiFetch(`/parents/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this parent</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: parent } = (await res.json()) as { data: ParentDetail };
  const loginEmail = parent.loginIdentifiers.find((li) => li.identifierType === "EMAIL")?.value ?? null;
  const loginMobile = parent.loginIdentifiers.find((li) => li.identifierType === "MOBILE")?.value ?? null;
  const primaryForCount = parent.children.filter((c) => c.isPrimaryContact).length;

  const pills: ProfilePill[] = [
    { label: parent.status, tone: statusTone(parent.status) },
    { label: `${parent.children.length} child${parent.children.length === 1 ? "" : "ren"}`, tone: "neutral" },
  ];
  const stats: ProfileStat[] = [
    {
      label: "Children linked",
      value: String(parent.children.length),
      hint: primaryForCount > 0 ? `primary contact for ${primaryForCount}` : undefined,
    },
  ];

  return (
    <div className="mx-auto max-w-[960px]">
      <BackLink href="/principal/parents" label="Back to parents" />
      <ProfileHeader
        photo={
          <PersonAvatar
            photoUrl={parent.photoUrl}
            name={`${parent.firstName} ${parent.lastName ?? ""}`}
            size={112}
            shape="square"
          />
        }
        name={`${parent.firstName} ${parent.lastName ?? ""}`}
        subtitle={parent.mobile ?? parent.email ?? "No contact on file"}
        pills={pills}
        stats={stats}
      />

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Contact details</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Mobile</dt>
            <dd className="text-text">{parent.mobile ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Email</dt>
            <dd className="text-text">{parent.email ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Login &amp; security</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Login email</dt>
            <dd className="text-text">{loginEmail ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Login mobile</dt>
            <dd className="text-text">{loginMobile ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">
          Linked children ({parent.children.length})
        </h2>

        {parent.children.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">No children linked yet.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {parent.children.map((child) => (
              <div key={child.id} className="rounded-[14px] border border-border p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PersonAvatar
                      photoUrl={child.studentPhotoUrl}
                      name={`${child.studentFirstName} ${child.studentLastName ?? ""}`}
                      size={40}
                    />
                    <div>
                      <Link
                        href={`/principal/students/${child.studentId}`}
                        className="text-[14px] font-bold text-primary hover:underline"
                      >
                        {child.studentFirstName} {child.studentLastName ?? ""}
                      </Link>
                      <p className="text-xs text-text-muted">
                        {child.studentAdmissionNo}
                        {child.gradeName ? ` · ${child.gradeName}${child.sectionName ? ` ${child.sectionName}` : ""}` : ""}
                      </p>
                    </div>
                  </div>
                  <StatusPill tone={statusTone(child.status)} label={child.status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-[13px] sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Relationship</p>
                    <p className="mt-0.5 font-semibold text-text">{child.relationship.charAt(0) + child.relationship.slice(1).toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Occupation</p>
                    <p className="mt-0.5 font-semibold text-text">{child.occupation ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Annual income</p>
                    <p className="mt-0.5 font-semibold text-text">
                      {child.annualIncomePaise ? formatMoneySummary(child.annualIncomePaise) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Access</p>
                    <p className="mt-0.5 font-semibold text-text">
                      {child.isPrimaryContact && "Primary contact"}
                      {child.isPrimaryContact && child.isAuthorisedPickup && " · "}
                      {child.isAuthorisedPickup && "Authorised pickup"}
                      {!child.isPrimaryContact && !child.isAuthorisedPickup && "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
