// Profile -- the selected child's own basic-info profile: read-only, no
// photo upload (that's the school office's job, not a parent's). Bus route
// is pulled in as one stat only, from the same getBusAllocation the /parent/bus
// page shows in full -- not duplicated here as its own section.

import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import { ProfileHeader, type ProfilePill, type ProfileStat } from "@/components/dashboard/ProfileHeader";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getBusAllocation, getStudentProfile, listChildren, resolveSelectedChild } from "@/lib/parent-api";

// Plain date math, no library -- years elapsed since dateOfBirth, adjusted
// down by one if this year's birthday hasn't happened yet.
function computeAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "—";
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return `${age} yrs`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold text-text">{value}</span>
    </div>
  );
}

export default async function ParentProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const [profile, bus] = await Promise.all([
      getStudentProfile(selected.studentId),
      getBusAllocation(selected.studentId).catch(() => null),
    ]);

    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
    const pills: ProfilePill[] = [{ label: profile.admissionNo, tone: "neutral" }];
    const stats: ProfileStat[] = [
      { label: "Blood group", value: profile.bloodGroup ?? "—" },
      { label: "Age", value: computeAge(profile.dateOfBirth) },
      { label: "Bus route", value: bus?.routeName ?? "—" },
    ];

    return (
      <div className="mx-auto max-w-[960px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-text">Profile</h1>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        <div className="mt-6">
          <ProfileHeader
            photo={<PersonAvatar photoUrl={profile.photoUrl} name={fullName} size={96} shape="circle" />}
            name={fullName}
            subtitle={
              profile.gradeName
                ? `${profile.gradeName} · Section ${profile.sectionName ?? "—"}${
                    profile.rollNo !== null ? ` · Roll ${profile.rollNo}` : ""
                  }`
                : "Not enrolled in a class yet"
            }
            pills={pills}
            stats={stats}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <section className="rounded-[16px] border border-border bg-surface p-[18px]">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">School</h2>
            <div className="mt-3 flex flex-col divide-y divide-border">
              <InfoRow label="Admission no." value={profile.admissionNo} />
              <InfoRow label="Grade" value={profile.gradeName ?? "—"} />
              <InfoRow label="Section" value={profile.sectionName ?? "—"} />
              <InfoRow label="Medium" value={profile.mediumName ?? "—"} />
            </div>
          </section>

          <section className="rounded-[16px] border border-border bg-surface p-[18px]">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Personal</h2>
            <div className="mt-3 flex flex-col divide-y divide-border">
              <InfoRow label="Date of birth" value={formatDate(profile.dateOfBirth)} />
              <InfoRow label="Gender" value={profile.gender ?? "—"} />
              <InfoRow label="Blood group" value={profile.bloodGroup ?? "—"} />
            </div>
          </section>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this profile. Nothing was changed — try again." />;
  }
}
