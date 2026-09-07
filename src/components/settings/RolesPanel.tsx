// Roles catalog -- read-only. Module access is a static per-role map on the
// backend (roles.controller.ts), not user-editable, so this panel has no forms.

export interface Role {
  code: string;
  name: string;
  isCoreLogin: boolean;
  description?: string | null;
  moduleAccess: string[];
}

export function RolesPanel({ roles }: { roles: Role[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        Roles and their module access are fixed by the system and cannot be edited here.
      </p>
      <div className="overflow-hidden rounded-[11px] border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-field">
            <tr>
              <th className="px-3.5 py-2.5 text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                Role
              </th>
              <th className="px-3.5 py-2.5 text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                Core login
              </th>
              <th className="px-3.5 py-2.5 text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                Description
              </th>
              <th className="px-3.5 py-2.5 text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                Module access
              </th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.code} className="border-t border-border">
                <td className="px-3.5 py-2.5">
                  <p className="font-semibold text-text">{role.name}</p>
                  <p className="text-xs text-text-muted">{role.code}</p>
                </td>
                <td className="px-3.5 py-2.5 text-text">{role.isCoreLogin ? "Yes" : "No"}</td>
                <td className="px-3.5 py-2.5 text-text-muted">{role.description || "—"}</td>
                <td className="px-3.5 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {role.moduleAccess.length === 0 && <span className="text-text-muted">—</span>}
                    {role.moduleAccess.map((m) => (
                      <span
                        key={m}
                        className="rounded-[7px] bg-field px-2 py-1 text-xs font-semibold text-text"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3.5 py-6 text-center text-text-muted">
                  No roles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
