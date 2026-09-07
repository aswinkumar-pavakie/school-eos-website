// Principal -> Settings: deliberately NOT a mirror of Admin's 4-tab Settings
// page. Admin's "Settings, Master Data & Audit" module is School Profile edit
// + Roles catalog + Document Retention Policies + Terminal/device
// registration -- pure system Administration/Configuration, not oversight
// data. The approved API doc has no "leadership"/Principal callout anywhere
// for these four areas (unlike Attendance/Announcements/Audit Log, which do),
// and every other Configuration-tier area this build has touched (Library
// config, Hostel structure setup, Inventory categories) was excluded from
// Principal for the same reason. Roles/Retention/Terminals stay ADMIN-only
// end to end -- no backend broadening, no frontend page. School Profile is
// the one exception: it's basic institutional identity info (name, board,
// address, contact) with zero write/security risk, so it's shown here
// read-only (GET /school broadened to PRINCIPAL; PATCH stays ADMIN-only).

import { apiFetch } from "@/lib/api";

interface School {
  name: string;
  code: string;
  board: string;
  schoolType: string;
  recognitionNo: string | null;
  stateSchoolCode: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  timezone: string;
  defaultLocale: string;
}

function Item({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-text">{value || "—"}</dd>
    </div>
  );
}

export default async function PrincipalSettingsPage() {
  const res = await apiFetch("/school");

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load the school profile</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: school } = (await res.json()) as { data: School };
  const address = [school.addressLine1, school.addressLine2, school.city, school.district, school.state, school.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-[820px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Settings</h1>
      <p className="mt-1 text-sm text-text-muted">
        School profile — read-only. Roles, document retention policies, and terminal/device registration are
        Administration configuration and remain in Admin&apos;s own Settings module.
      </p>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">School profile</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
          <Item label="School name" value={school.name} />
          <Item label="Code" value={school.code} />
          <Item label="Board" value={school.board} />
          <Item label="School type" value={school.schoolType.replace(/_/g, " ")} />
          <Item label="Recognition no." value={school.recognitionNo} />
          <Item label="State school code" value={school.stateSchoolCode} />
          <div className="col-span-2">
            <Item label="Address" value={address} />
          </div>
          <Item label="Contact phone" value={school.contactPhone} />
          <Item label="Contact email" value={school.contactEmail} />
          <Item label="Timezone" value={school.timezone} />
          <Item label="Default locale" value={school.defaultLocale} />
        </dl>
      </section>
    </div>
  );
}
