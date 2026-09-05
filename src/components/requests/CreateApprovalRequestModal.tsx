"use client";

// Create-request modal -- same shape as the other admin create-modals (480px,
// Design Architecture v0.1 component 13). The fields shown change with the
// request type: only the six Admin owns are offered at all (see
// admin-request-types.ts on the backend) -- everything academic,
// disciplinary, staff-performance or finance-operational simply has no entry
// here, by design, not by omission.

import { useActionState, useState } from "react";
import { createApprovalRequestAction, type FormActionState } from "@/app/(dashboard)/admin/requests/actions";
import { Field, SelectField, TextAreaField } from "@/components/dashboard/FormFields";
import { PersonPicker } from "@/components/dashboard/PersonPicker";
import { InventoryItemPicker } from "@/components/inventory/InventoryItemPicker";
import { StudentPersonPicker } from "@/components/parents/StudentPersonPicker";

const initialState: FormActionState = {};

const REQUEST_TYPES: [string, string][] = [
  ["ADMIN_ACCESS_REQUEST", "Administrative user / access request"],
  ["ATTENDANCE_CORRECTION_REQUEST", "Attendance correction"],
  ["STUDENT_RECORD_CORRECTION_REQUEST", "Student administrative record correction"],
  ["INVENTORY_REQUEST", "Inventory request"],
  ["REPAIR_MAINTENANCE_REQUEST", "Repair & maintenance request"],
  ["ADMIN_OTHER_REQUEST", "Other administrative request"],
];

const STUDENT_FIELDS: [string, string][] = [
  ["admissionNo", "Admission no."],
  ["stateStudentId", "State student ID"],
  ["mediumId", "Medium"],
  ["motherTongue", "Mother tongue"],
  ["languageSubjectChoice", "Language subject choice"],
  ["communityCategory", "Community category"],
  ["supportNeeds", "Support needs"],
  ["bloodGroup", "Blood group"],
  ["commuteMode", "Commute mode"],
  ["bankAccountRef", "Bank account reference"],
];

export function CreateApprovalRequestModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createApprovalRequestAction, initialState);
  const [requestType, setRequestType] = useState("ADMIN_ACCESS_REQUEST");
  const [accessAction, setAccessAction] = useState("ACTIVATE");
  const [inventoryAction, setInventoryAction] = useState("ISSUE");

  const [accessTarget, setAccessTarget] = useState<{ id: string } | null>(null);
  const [studentTarget, setStudentTarget] = useState<{ id: string } | null>(null);
  const [inventoryTarget, setInventoryTarget] = useState<{ id: string } | null>(null);
  const [repairItem, setRepairItem] = useState<{ id: string } | null>(null);
  const [assignee, setAssignee] = useState<{ id: string } | null>(null);
  const [requestedBy, setRequestedBy] = useState<{ id: string } | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,111,224,.25)] transition-opacity hover:opacity-90"
      >
        + New request
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
          <div className="w-full max-w-[520px] rounded-[16px] bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">New administrative request</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg"
              >
                ×
              </button>
            </div>

            {state.error && (
              <p role="alert" className="mt-4 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text">
                {state.error}
              </p>
            )}

            <form
              action={(formData) => {
                formAction(formData);
                setOpen(false);
              }}
              className="mt-4 flex flex-col gap-4"
              noValidate
            >
              <SelectField
                label="Request type"
                name="requestType"
                required
                disabled={isPending}
                defaultValue={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                options={REQUEST_TYPES}
              />

              <div>
                <input type="hidden" name="requestedByPersonId" value={requestedBy?.id ?? ""} />
                <PersonPicker label="On behalf of (optional -- defaults to you)" disabled={isPending} onSelect={setRequestedBy} />
              </div>

              <TextAreaField label="Description" name="description" required disabled={isPending} />
              <Field label="Reason (optional)" name="reason" disabled={isPending} />

              {requestType === "ADMIN_ACCESS_REQUEST" && (
                <div className="flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
                  <SelectField
                    label="Action"
                    name="action"
                    disabled={isPending}
                    defaultValue={accessAction}
                    onChange={(e) => setAccessAction(e.target.value)}
                    options={[
                      ["ACTIVATE", "Activate account"],
                      ["DEACTIVATE", "Deactivate account"],
                      ["GRANT_ROLE", "Grant role"],
                      ["REVOKE_ROLE", "Revoke role"],
                    ]}
                  />
                  {accessAction === "REVOKE_ROLE" ? (
                    <Field label="Role assignment ID" name="roleAssignmentId" required disabled={isPending} />
                  ) : (
                    <>
                      <input type="hidden" name="targetPersonId" value={accessTarget?.id ?? ""} />
                      <PersonPicker label="Person *" disabled={isPending} onSelect={setAccessTarget} />
                    </>
                  )}
                  {accessAction === "GRANT_ROLE" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Role code" name="roleCode" required disabled={isPending} placeholder="e.g. CLASS_ADVISOR" />
                      <SelectField
                        label="Scope"
                        name="scopeType"
                        disabled={isPending}
                        defaultValue="SCHOOL"
                        options={[
                          ["SCHOOL", "Whole school"],
                          ["GRADE", "Standard"],
                          ["SECTION", "Section"],
                          ["SUBJECT_OFFERING", "Subject"],
                        ]}
                      />
                      <Field label="Scope ID (if not whole school)" name="scopeId" disabled={isPending} />
                    </div>
                  )}
                </div>
              )}

              {requestType === "ATTENDANCE_CORRECTION_REQUEST" && (
                <div className="flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
                  <Field
                    label="Attendance record ID"
                    name="attendanceRecordId"
                    required
                    disabled={isPending}
                    placeholder="From the student's Attendance history"
                  />
                  <SelectField
                    label="Corrected status"
                    name="newStatus"
                    disabled={isPending}
                    defaultValue="PRESENT"
                    options={[
                      ["PRESENT", "Present"],
                      ["ABSENT", "Absent"],
                      ["LATE", "Late"],
                      ["ON_LEAVE", "On leave"],
                      ["HALF_DAY", "Half day"],
                    ]}
                  />
                </div>
              )}

              {requestType === "STUDENT_RECORD_CORRECTION_REQUEST" && (
                <div className="flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
                  <input type="hidden" name="studentId" value={studentTarget?.id ?? ""} />
                  <StudentPersonPicker disabled={isPending} onSelect={setStudentTarget} />
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField
                      label="Field to correct"
                      name="field"
                      disabled={isPending}
                      defaultValue="admissionNo"
                      options={STUDENT_FIELDS}
                    />
                    <Field label="New value" name="newValue" required disabled={isPending} />
                  </div>
                </div>
              )}

              {requestType === "INVENTORY_REQUEST" && (
                <div className="flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
                  <input type="hidden" name="itemId" value={inventoryTarget?.id ?? ""} />
                  <InventoryItemPicker disabled={isPending} onSelect={setInventoryTarget} />
                  <SelectField
                    label="Action"
                    name="action"
                    disabled={isPending}
                    defaultValue={inventoryAction}
                    onChange={(e) => setInventoryAction(e.target.value)}
                    options={[
                      ["ISSUE", "Issue / assign"],
                      ["TRANSFER", "Transfer location"],
                    ]}
                  />
                  {inventoryAction === "ISSUE" ? (
                    <div>
                      <input type="hidden" name="assignedToPersonId" value={assignee?.id ?? ""} />
                      <PersonPicker label="Issue to *" disabled={isPending} onSelect={setAssignee} />
                    </div>
                  ) : (
                    <Field label="New location" name="location" required disabled={isPending} />
                  )}
                </div>
              )}

              {requestType === "REPAIR_MAINTENANCE_REQUEST" && (
                <div className="flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
                  <Field label="Title" name="title" required disabled={isPending} placeholder="e.g. Broken chair in Room 12" />
                  <input type="hidden" name="inventoryItemId" value={repairItem?.id ?? ""} />
                  <InventoryItemPicker disabled={isPending} onSelect={setRepairItem} />
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField
                      label="Issue type"
                      name="issueType"
                      disabled={isPending}
                      defaultValue="OTHER"
                      options={[
                        ["ELECTRICAL", "Electrical"],
                        ["PLUMBING", "Plumbing"],
                        ["CIVIL", "Civil"],
                        ["IT_EQUIPMENT", "IT equipment"],
                        ["FURNITURE", "Furniture"],
                        ["OTHER", "Other"],
                      ]}
                    />
                    <SelectField
                      label="Priority"
                      name="priority"
                      disabled={isPending}
                      defaultValue="MEDIUM"
                      options={[
                        ["LOW", "Low"],
                        ["MEDIUM", "Medium"],
                        ["HIGH", "High"],
                        ["URGENT", "Urgent"],
                      ]}
                    />
                  </div>
                  <Field label="Location" name="location" disabled={isPending} />
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {isPending ? "Submitting…" : "Submit request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
