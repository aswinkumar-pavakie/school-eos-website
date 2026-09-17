// Identity, Roles & Assignments -- real data. GET /roles (the role catalog +
// static module-access preview) and GET /role-assignments (real
// role_assignment rows, 1119 of them, with person/scope names already joined)
// both already existed as full, working APIs -- confirmed via backend audit
// -- just never wired to any frontend page. Grant reuses the same real
// POST /role-assignments the backend already validates (single-instance-role
// uniqueness, scope shape per role, ADMIN itself blocked from being granted
// here); revoke reuses POST /role-assignments/:id/revoke unchanged.

import { AccessControlTabs, type RoleRow, type RoleAssignmentRow } from "@/components/access-control/AccessControlTabs";
import { apiFetch } from "@/lib/api";

export default async function AccessControlPage() {
  const [rolesRes, assignmentsRes] = await Promise.all([
    apiFetch("/roles"),
    apiFetch("/role-assignments"),
  ]);

  if (!rolesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Identity, Roles &amp; Assignments</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: roles }: { data: RoleRow[] } = await rolesRes.json();
  const { data: assignments }: { data: RoleAssignmentRow[] } = assignmentsRes.ok
    ? await assignmentsRes.json()
    : { data: [] };

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Identity, Roles &amp; Assignments</h1>
      <p className="mt-1 text-sm text-text-muted">The role catalog, and who currently holds which role and scope.</p>
      <div className="mt-6">
        <AccessControlTabs roles={roles} assignments={assignments} />
      </div>
    </div>
  );
}
