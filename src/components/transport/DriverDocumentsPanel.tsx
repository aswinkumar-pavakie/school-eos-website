"use client";

// Driver documents -- new operational surface for Transport Manager (and
// Admin, if this panel is reused there later) on top of the new
// driver_document table/endpoints. Same UI language as DriversPanel/shared.tsx.
// No delete action: DELETE stays ADMIN-only on the backend (see
// drivers.controller.ts), so this panel doesn't offer a button that would
// only ever come back as a 403 for a Transport Manager.

import { useActionState, useState } from "react";
import {
  createDriverDocumentAction,
  updateDriverDocumentAction,
  type FormActionState,
} from "@/app/(dashboard)/transport-manager/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateForm, SelectField } from "./shared";

export interface DriverDocument {
  id: string;
  driverId: string;
  docType: string;
  docNo: string | null;
  validFrom: string | null;
  validTo: string;
  objectKey: string | null;
}

const DOC_TYPE_OPTIONS: [string, string][] = [
  ["LICENCE", "Driving licence"],
  ["MEDICAL_CERTIFICATE", "Medical certificate"],
  ["POLICE_VERIFICATION", "Police verification"],
  ["OTHER", "Other"],
];

const DOC_TYPE_LABEL = Object.fromEntries(DOC_TYPE_OPTIONS);

function expiryStatus(validTo: string): { tone: "success" | "pending" | "critical"; label: string } {
  const today = new Date().toISOString().slice(0, 10);
  const daysLeft = Math.ceil(
    (new Date(validTo).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysLeft < 0) return { tone: "critical", label: "Expired" };
  if (daysLeft <= 30) return { tone: "pending", label: `Expires in ${daysLeft}d` };
  return { tone: "success", label: "Valid" };
}

const initialState: FormActionState = {};

type CreateAction = typeof createDriverDocumentAction;
type UpdateAction = typeof updateDriverDocumentAction;

export function DriverDocumentsPanel({
  driverId,
  documents,
  createAction = createDriverDocumentAction,
  updateAction = updateDriverDocumentAction,
}: {
  driverId: string;
  documents: DriverDocument[];
  /** Defaults to Transport Manager's own action. Admin's driver detail page
   * passes its own (identical endpoint, revalidates /admin/transport/... instead). */
  createAction?: CreateAction;
  updateAction?: UpdateAction;
}) {
  const [adding, setAdding] = useState(false);
  const action = createAction.bind(null, driverId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{documents.length} document(s)</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + Add document
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm
          title="Add driver document"
          onCancel={() => setAdding(false)}
          formAction={formAction}
          isPending={isPending}
          error={state.error}
          submitLabel="Add"
        >
          <SelectField label="Document type" name="docType" required disabled={isPending} options={DOC_TYPE_OPTIONS} />
          <Field label="Document no. (optional)" name="docNo" disabled={isPending} />
          <Field label="Valid from (optional)" name="validFrom" type="date" disabled={isPending} />
          <Field label="Valid to" name="validTo" type="date" required disabled={isPending} />
        </PanelCreateForm>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="py-2.5 pr-3">Type</th>
              <th className="py-2.5 pr-3">Doc no.</th>
              <th className="py-2.5 pr-3">Valid to</th>
              <th className="py-2.5 pr-3">Status</th>
              <th className="py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-text-muted">
                  No documents on file yet.
                </td>
              </tr>
            )}
            {documents.map((doc) => {
              const status = expiryStatus(doc.validTo);
              return (
                <DocumentRow
                  key={doc.id}
                  driverId={driverId}
                  doc={doc}
                  status={status}
                  editing={editingId === doc.id}
                  onToggle={() => setEditingId((v) => (v === doc.id ? null : doc.id))}
                  updateAction={updateAction}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentRow({
  driverId,
  doc,
  status,
  editing,
  onToggle,
  updateAction,
}: {
  driverId: string;
  doc: DriverDocument;
  status: { tone: "success" | "pending" | "critical"; label: string };
  editing: boolean;
  onToggle: () => void;
  updateAction: UpdateAction;
}) {
  const action = updateAction.bind(null, driverId, doc.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <>
      <tr>
        <td className="py-3 pr-3 font-semibold text-text">{DOC_TYPE_LABEL[doc.docType] ?? doc.docType}</td>
        <td className="py-3 pr-3 text-text-muted">{doc.docNo ?? "—"}</td>
        <td className="py-3 pr-3 text-text-muted">{doc.validTo}</td>
        <td className="py-3 pr-3">
          <StatusPill tone={status.tone} label={status.label} />
        </td>
        <td className="py-3 text-right">
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </td>
      </tr>
      {editing && (
        <tr>
          <td colSpan={5} className="pb-3">
            <form action={formAction} className="flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
              {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
              <div className="grid grid-cols-2 gap-2.5">
                <SelectField
                  label="Document type"
                  name="docType"
                  disabled={isPending}
                  defaultValue={doc.docType}
                  options={DOC_TYPE_OPTIONS}
                />
                <Field label="Document no." name="docNo" disabled={isPending} defaultValue={doc.docNo ?? undefined} />
                <Field
                  label="Valid from"
                  name="validFrom"
                  type="date"
                  disabled={isPending}
                  defaultValue={doc.validFrom ?? undefined}
                />
                <Field label="Valid to" name="validTo" type="date" disabled={isPending} defaultValue={doc.validTo} />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save changes"}
              </button>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
