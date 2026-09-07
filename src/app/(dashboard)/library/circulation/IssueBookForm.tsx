"use client";

import { useActionState, useState } from "react";
import { issueBookAction, type FormActionState } from "./actions";
import { CopyPicker } from "@/components/library/CopyPicker";
import { MemberPicker } from "@/components/library/MemberPicker";
import type { IssuableCopyHit, MemberHit } from "../search-actions";

const initialState: FormActionState = {};

export function IssueBookForm() {
  const [copy, setCopy] = useState<IssuableCopyHit | null>(null);
  const [member, setMember] = useState<MemberHit | null>(null);
  const [state, formAction, isPending] = useActionState(issueBookAction, initialState);

  return (
    <form
      action={(formData) => {
        formAction(formData);
        setCopy(null);
        setMember(null);
      }}
      className="rounded-[16px] border border-border bg-surface p-[18px]"
    >
      <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Issue a book</h2>
      {state.error && <p className="mt-2 text-xs font-medium text-critical-text">{state.error}</p>}
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <input type="hidden" name="copyId" value={copy?.copyId ?? ""} />
        <input type="hidden" name="memberId" value={member?.id ?? ""} />
        <div className="w-64">
          <CopyPicker disabled={isPending} onSelect={setCopy} />
        </div>
        <div className="w-56">
          <MemberPicker disabled={isPending} onSelect={setMember} />
        </div>
        <button
          type="submit"
          disabled={isPending || !copy || !member}
          className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Issuing…" : "Issue"}
        </button>
      </div>
    </form>
  );
}
