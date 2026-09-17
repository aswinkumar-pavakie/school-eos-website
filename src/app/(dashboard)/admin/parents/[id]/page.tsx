// Parent profile -- Design Architecture v0.1 module 04. Basic info + linked
// children, read-only. Linking a NEW child (or editing an existing guardian_link)
// happens from the Student's own profile (GuardiansSection.tsx) -- not duplicated
// here, since the link is created against a student, not a parent.

import { notFound } from "next/navigation";
import Link from "next/link";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import { PersonPhotoEditor } from "@/components/dashboard/PersonPhotoEditor";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { EditParentContactForm } from "@/components/parents/EditParentContactForm";
import { GuardianOccupationForm } from "@/components/parents/GuardianOccupationForm";
import { ParentAccountStatusAction } from "@/components/parents/ParentAccountStatusAction";
import { ParentLoginSecuritySection } from "@/components/parents/ParentLoginSecuritySection";
import {
  ParentProfileView,
  type ParentProfileInfoCard,
  type ParentProfilePill,
  type ParentProfileSection,
  type ParentProfileStat,
} from "@/components/parents/ParentProfileView";
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
  accessLevel: string;
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
  resetAllowanceUsed: boolean;
  adminVisiblePassword: string | null;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  return status === "ACTIVE" ? "success" : "critical";
}

export default async function ParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
  const loginEmail =
    parent.loginIdentifiers.find((li) => li.identifierType === "EMAIL")?.value ?? null;
  const primaryForCount = parent.children.filter((c) => c.isPrimaryContact).length;

  const pills: ParentProfilePill[] = [
    { label: parent.status, tone: statusTone(parent.status) },
    { label: `${parent.children.length} child${parent.children.length === 1 ? "" : "ren"}`, tone: "neutral" },
  ];
  const stats: ParentProfileStat[] = [
    {
      label: "Children linked",
      value: String(parent.children.length),
      hint: primaryForCount > 0 ? `primary contact for ${primaryForCount}` : undefined,
    },
  ];

  const infoCards: ParentProfileInfoCard[] = [
    {
      title: "Profile",
      rows: [
        ["Mobile", parent.mobile ?? "—"],
        ["Email", parent.email ?? "—"],
      ],
    },
  ];

  const sections: ParentProfileSection[] = [
    {
      key: "contact",
      title: "Edit contact details",
      subtitle: "Name isn't editable here.",
      content: (
        <EditParentContactForm
          personId={parent.id}
          mobile={parent.mobile}
          email={parent.email}
          loginEmail={loginEmail}
        />
      ),
    },
    {
      key: "login",
      title: "Login & security",
      subtitle: "The parent's own login, distinct from the contact details above.",
      content: (
        <div className="mt-3">
          <ParentLoginSecuritySection
            personId={parent.id}
            personName={`${parent.firstName} ${parent.lastName ?? ""}`.trim()}
            loginIdentifiers={parent.loginIdentifiers}
            resetAllowanceUsed={parent.resetAllowanceUsed}
            adminVisiblePassword={parent.adminVisiblePassword}
          />
        </div>
      ),
    },
    {
      key: "children",
      title: `Linked children (${parent.children.length})`,
      subtitle:
        'To link this parent to another child, open that student\'s profile and use "Link guardian" there and search for this parent by name.',
      content:
        parent.children.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">No children linked yet.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {parent.children.map((child) => (
              <div key={child.id} className="card-hover rounded-[14px] border border-border p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PersonAvatar
                      photoUrl={child.studentPhotoUrl}
                      name={`${child.studentFirstName} ${child.studentLastName ?? ""}`}
                      size={40}
                    />
                    <div>
                      <Link
                        href={`/admin/students/${child.studentId}`}
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
                    <div className="mt-0.5">
                      <GuardianOccupationForm
                        guardianLinkId={child.id}
                        personId={parent.id}
                        occupation={child.occupation}
                      />
                    </div>
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
        ),
    },
    {
      key: "account",
      title: "Account",
      subtitle: "Deactivating locks this parent out of their login — their children's records are untouched.",
      content: (
        <div className="mt-3">
          <ParentAccountStatusAction personId={parent.id} status={parent.status} />
        </div>
      ),
    },
  ];

  return (
    <ParentProfileView
      backHref="/admin/parents"
      photo={
        <PersonPhotoEditor
          personId={parent.id}
          photoUrl={parent.photoUrl}
          name={`${parent.firstName} ${parent.lastName ?? ""}`}
          revalidatePaths={["/admin/parents", `/admin/parents/${parent.id}`]}
          size={112}
          shape="square"
        />
      }
      name={`${parent.firstName} ${parent.lastName ?? ""}`}
      subtitle={parent.mobile ?? parent.email ?? "No contact on file"}
      pills={pills}
      stats={stats}
      infoCards={infoCards}
      sections={sections}
    />
  );
}
