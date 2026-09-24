"use client";

// Admin view of the phones/browsers a faculty member has linked their class account
// on, with a one-click cut-off (lost phone, suspected leak). Revoking ends the links
// and any switched-in class sessions at once; the teacher re-adds once on their own
// phone. Design: school-eos-website/rnd-linked-account-switching.md.

import { useState, useTransition } from "react";
import { revokeLinkedAccountsAction } from "@/app/(dashboard)/admin/faculty/actions";
import { formatDate } from "@/lib/format";

export interface LinkedPhoneRow {
  id: string;
  label: string;
  deviceLabel: string | null;
  createdAt: string;
  lastUsedAt: string;
}

export function LinkedPhonesSection({ personId, phones }: { personId: string; phones: LinkedPhoneRow[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function revokeAll() {
    if (!window.confirm("Remove every linked phone for this teacher? They will need to add the class account again on their own phone.")) {
      return;
    }
    startTransition(async () => {
      const result = await revokeLinkedAccountsAction(personId);
      setMessage(result.error ?? `Removed ${result.revoked ?? 0} linked phone(s).`);
    });
  }

  return (
    <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Linked phones</h2>
        {phones.length > 0 && (
          <button
            type="button"
            onClick={revokeAll}
            disabled={isPending}
            className="text-[13px] font-semibold text-critical-text disabled:opacity-60"
          >
            {isPending ? "Removing…" : "Revoke all"}
          </button>
        )}
      </div>
      <p className="mt-1 text-[13px] text-text-muted">
        Phones and browsers where this teacher added their class account. A leaked Faculty password alone cannot add one.
      </p>
      {phones.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">No linked phones.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border text-sm">
          {phones.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className="font-semibold text-text">Class {p.label}</span>
              <span className="text-text-muted">{p.deviceLabel ?? "Unknown device"}</span>
              <span className="text-[12px] text-text-muted">
                added {formatDate(p.createdAt)} · last used {formatDate(p.lastUsedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="mt-2 text-[13px] text-text-muted">{message}</p>}
    </section>
  );
}
