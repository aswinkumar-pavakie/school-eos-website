"use client";

// Basic info + Address used to be two separate cards, each with its own save
// button -- now one form, one "Save changes" button at the top, even though it
// still fires two PATCHes under the hood (student fields + person address).

import { useActionState, useState } from "react";
import { updateStudentProfileAction, type FormActionState } from "@/app/(dashboard)/admin/students/actions";
import { AddressFields, type AddressValues } from "@/components/dashboard/AddressForm";
import { HeaderButtonPortal } from "@/components/dashboard/HeaderButtonPortal";

export const STUDENT_SAVE_BUTTON_SLOT = "student-profile-save-slot";
const FORM_ID = "student-profile-form";

interface StudentDetail {
  id: string;
  personId: string;
  admissionNo: string;
  stateStudentId: string | null;
  motherTongue: string | null;
  communityCategory: string | null;
  bloodGroup: string | null;
  isFirstGenLearner: boolean;
  isDifferentlyAbled: boolean;
  isHosteller: boolean;
  usesSchoolTransport: boolean;
  commuteMode: string | null;
}

const COMMUTE_MODES: [string, string][] = [
  ["WALK", "Walks"],
  ["PARENT_DROP", "Parent drop-off"],
  ["PRIVATE_VEHICLE", "Private vehicle"],
  ["PUBLIC_TRANSPORT", "Public transport"],
  ["OTHER", "Other"],
];

const initialState: FormActionState = {};

export function StudentProfileForm({ student, address }: { student: StudentDetail; address: AddressValues }) {
  const action = updateStudentProfileAction.bind(null, student.id, student.personId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [usesTransport, setUsesTransport] = useState(student.usesSchoolTransport);

  return (
    <form id={FORM_ID} action={formAction} className="mt-4 flex flex-col gap-5">
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text">
          {state.error}
        </p>
      )}

      <HeaderButtonPortal slotId={STUDENT_SAVE_BUTTON_SLOT}>
        <button
          type="submit"
          form={FORM_ID}
          disabled={isPending}
          className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </HeaderButtonPortal>

      <div className="flex flex-col gap-4">
        <h3 className="text-[13px] font-bold text-text">Basic information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Admission no.</span>
            <input
              name="admissionNo"
              defaultValue={student.admissionNo}
              disabled={isPending}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">State student ID</span>
            <input
              name="stateStudentId"
              defaultValue={student.stateStudentId ?? ""}
              disabled={isPending}
              placeholder="e.g. TN2025034567 (state EMIS/student ID, if issued)"
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Mother tongue</span>
            <input
              name="motherTongue"
              defaultValue={student.motherTongue ?? ""}
              disabled={isPending}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Blood group</span>
            <input
              name="bloodGroup"
              defaultValue={student.bloodGroup ?? ""}
              disabled={isPending}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          <label className="flex items-center gap-2 text-[13px] text-text">
            <input
              type="checkbox"
              name="isFirstGenLearner"
              defaultChecked={student.isFirstGenLearner}
              disabled={isPending}
              className="h-4 w-4 rounded border-border"
            />
            First-gen learner
          </label>
          <label className="flex items-center gap-2 text-[13px] text-text">
            <input
              type="checkbox"
              name="isDifferentlyAbled"
              defaultChecked={student.isDifferentlyAbled}
              disabled={isPending}
              className="h-4 w-4 rounded border-border"
            />
            Differently abled
          </label>
          <label className="flex items-center gap-2 text-[13px] text-text">
            <input
              type="checkbox"
              name="isHosteller"
              defaultChecked={student.isHosteller}
              disabled={isPending}
              className="h-4 w-4 rounded border-border"
            />
            Hosteller
          </label>
          <label className="flex items-center gap-2 text-[13px] text-text">
            <input
              type="checkbox"
              name="usesSchoolTransport"
              defaultChecked={student.usesSchoolTransport}
              onChange={(e) => setUsesTransport(e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-border"
            />
            Uses transport
          </label>
        </div>
        {!usesTransport && (
          <label className="flex max-w-xs flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">How do they get to school?</span>
            <select
              name="commuteMode"
              defaultValue={student.commuteMode ?? ""}
              disabled={isPending}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
            >
              <option value="">Not recorded</option>
              {COMMUTE_MODES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div>
          <h3 className="text-[13px] font-bold text-text">Address</h3>
          <p className="text-xs text-text-muted">Printed on the back of the ID card.</p>
        </div>
        <AddressFields address={address} disabled={isPending} />
      </div>
    </form>
  );
}
