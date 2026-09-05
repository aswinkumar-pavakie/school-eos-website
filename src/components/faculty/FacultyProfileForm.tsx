"use client";

// Employment details + Address used to be two separate cards, each with its
// own save button -- now one form, one "Save changes" button at the top, even
// though it still fires two PATCHes under the hood (staff fields + person
// address).

import { useActionState } from "react";
import { updateFacultyProfileAction, type FormActionState } from "@/app/(dashboard)/admin/faculty/actions";
import { AddressFields, type AddressValues } from "@/components/dashboard/AddressForm";
import { HeaderButtonPortal } from "@/components/dashboard/HeaderButtonPortal";

export const FACULTY_SAVE_BUTTON_SLOT = "faculty-profile-save-slot";
const FORM_ID = "faculty-profile-form";

interface StaffDetail {
  id: string;
  personId: string;
  employeeNo: string;
  designation: string | null;
  teacherCategory: string | null;
  postType: string | null;
  stateTeacherId: string | null;
  isTeaching: boolean;
}

const initialState: FormActionState = {};

export function FacultyProfileForm({ staff, address }: { staff: StaffDetail; address: AddressValues }) {
  const action = updateFacultyProfileAction.bind(null, staff.id, staff.personId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form id={FORM_ID} action={formAction} className="mt-4 flex flex-col gap-5">
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text">
          {state.error}
        </p>
      )}

      <HeaderButtonPortal slotId={FACULTY_SAVE_BUTTON_SLOT}>
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
        <h3 className="text-[13px] font-bold text-text">Employment details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Employee no.</span>
            <input
              name="employeeNo"
              defaultValue={staff.employeeNo}
              disabled={isPending}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Designation</span>
            <input
              name="designation"
              defaultValue={staff.designation ?? ""}
              disabled={isPending}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Teacher category</span>
            <input
              name="teacherCategory"
              defaultValue={staff.teacherCategory ?? ""}
              disabled={isPending}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Post type</span>
            <select
              name="postType"
              defaultValue={staff.postType ?? ""}
              disabled={isPending}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
            >
              <option value="">—</option>
              <option value="GOVERNMENT">Government</option>
              <option value="AIDED">Aided</option>
              <option value="MANAGEMENT">Management</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">State teacher ID</span>
            <input
              name="stateTeacherId"
              defaultValue={staff.stateTeacherId ?? ""}
              disabled={isPending}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-text">
          <input
            type="checkbox"
            name="isTeaching"
            defaultChecked={staff.isTeaching}
            disabled={isPending}
            className="h-4 w-4 rounded border-border"
          />
          Teaching staff
        </label>
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
