// Settings -- account-level, not child-level: no `?studentId=` scoping and no
// ChildSwitcher here, deliberately (see the module brief). Every card here is
// static display copy; no backend concept exists yet for currency, language,
// or a data-privacy preference, so nothing here is wired to an API call.

export default function ParentSettingsPage() {
  return (
    <div className="mx-auto max-w-[720px]">
      <h1 className="text-2xl font-extrabold text-text">Settings</h1>
      <p className="mt-1 text-sm text-text-muted">Account-wide preferences for your login.</p>

      <div className="mt-6 flex flex-col gap-4">
        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Currency</h2>
          <p className="mt-2 text-sm text-text-muted">This school only ever deals in INR (₹).</p>
        </section>

        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Language</h2>
          <p className="mt-2 text-sm text-text-muted">English (UK) · more languages coming</p>
        </section>

        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Privacy and data</h2>
          <p className="mt-2 text-sm text-text-muted">
            Records are processed under the school&apos;s GDPR notice. You can request an export or erasure of your
            child&apos;s data from the school office.
          </p>
        </section>
      </div>
    </div>
  );
}
