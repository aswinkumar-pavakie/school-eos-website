import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { apiFetch } from "@/lib/api";

export default async function SettingsPage() {
  const [schoolRes, rolesRes, policiesRes, terminalsRes, vehiclesRes] = await Promise.all([
    apiFetch("/school"),
    apiFetch("/roles"),
    apiFetch("/document-retention-policies"),
    apiFetch("/terminals"),
    apiFetch("/vehicles"),
  ]);

  if (!schoolRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Settings</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: school } = await schoolRes.json();
  const { data: roles } = rolesRes.ok ? await rolesRes.json() : { data: [] };
  const { data: policies } = policiesRes.ok ? await policiesRes.json() : { data: [] };
  const { data: terminals } = terminalsRes.ok ? await terminalsRes.json() : { data: [] };
  const { data: vehicles } = vehiclesRes.ok ? await vehiclesRes.json() : { data: [] };

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Settings, Master Data & Audit</h1>
      <p className="mt-1 text-sm text-text-muted">
        School profile, roles catalog, document retention policies and terminal registration.
      </p>
      <div className="mt-6">
        <SettingsTabs school={school} roles={roles} policies={policies} terminals={terminals} vehicles={vehicles} />
      </div>
    </div>
  );
}
