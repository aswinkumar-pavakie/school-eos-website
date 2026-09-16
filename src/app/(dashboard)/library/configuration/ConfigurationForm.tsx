"use client";

import { useState } from "react";
import { updateLibraryConfigAction } from "./actions";
import { useLibraryToast } from "@/components/library-ui/toast/ToastProvider";
import type { LibraryConfig } from "@/lib/library-api";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="lib-card-hover" style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--lib-divider)", font: "600 19px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{title}</div>
      <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>{children}</div>
    </div>
  );
}

function NumberField({ label, name, defaultValue, disabled, step }: { label: string; name: string; defaultValue: number; disabled: boolean; step?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label htmlFor={name} style={{ font: "600 14px/1.2 var(--lib-font-sans)", color: "var(--lib-primary)" }}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        step={step}
        min={0}
        required
        defaultValue={defaultValue}
        disabled={disabled}
        className="lib-font-mono"
        style={{ padding: "13px 15px", border: "1px solid var(--lib-field-border)", borderRadius: 10, font: "400 15px/1.2 var(--lib-font-mono)" }}
      />
    </div>
  );
}

export function ConfigurationForm({ config }: { config: LibraryConfig }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const toast = useLibraryToast();
  const finePerDayRupees = Number(BigInt(config.finePerDayPaise)) / 100;

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);
    const result = await updateLibraryConfigAction({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.show("Library settings saved");
  }

  return (
    <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {error && (
        <p role="alert" style={{ padding: "10px 14px", borderRadius: 11, background: "var(--lib-red-bg)", color: "var(--lib-red)", font: "500 14px/1.4 var(--lib-font-sans)" }}>
          {error}
        </p>
      )}

      <SectionCard title="Borrowing rules">
        <NumberField label="Default borrowing days" name="loanPeriodDays" defaultValue={config.loanPeriodDays} disabled={pending} />
        <NumberField label="Max renewals" name="maxRenewals" defaultValue={config.maxRenewals} disabled={pending} />
        <NumberField label="Default books per member" name="maxBooksPerMember" defaultValue={config.maxBooksPerMember} disabled={pending} />
        <NumberField label="Reservation hold days" name="reservationHoldDays" defaultValue={config.reservationHoldDays} disabled={pending} />
      </SectionCard>

      <SectionCard title="Fines">
        <NumberField label="Fine per day (₹)" name="finePerDayRupees" defaultValue={finePerDayRupees} disabled={pending} step="0.01" />
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={pending}
          className="lib-btn-primary"
          style={{ padding: "14px 30px", border: 0, borderRadius: 11, background: "var(--lib-primary)", color: "#fff", font: "600 16px/1.2 var(--lib-font-sans)", cursor: "pointer", opacity: pending ? 0.7 : 1 }}
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
