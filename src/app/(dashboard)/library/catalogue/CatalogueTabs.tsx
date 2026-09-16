"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCategoryAction, updateCategoryAction } from "../books/actions";
import { LibraryModal } from "@/components/library-ui/Modal";
import { ConfirmAction } from "@/components/library-ui/ConfirmModal";
import { EmptyRow, Pill, SecondaryButton, TableShell, Td, Th } from "@/components/library-ui/primitives";
import { useLibraryToast } from "@/components/library-ui/toast/ToastProvider";
import type { CategoryStatus } from "@/lib/library-api";

interface SubjectRow {
  id: string;
  name: string;
  status: CategoryStatus;
  count: number;
}
interface RackRow {
  code: string;
  copies: number;
  subjects: string;
}

export function CatalogueTabs({ subjectRows, rackRows }: { subjectRows: SubjectRow[]; rackRows: RackRow[] }) {
  const [tab, setTab] = useState<"subjects" | "racks">("subjects");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: 4, borderRadius: 11, background: "var(--lib-panel)", alignSelf: "flex-start" }}>
        <TabButton active={tab === "subjects"} onClick={() => setTab("subjects")}>
          Subjects
        </TabButton>
        <TabButton active={tab === "racks"} onClick={() => setTab("racks")}>
          Racks
        </TabButton>
      </div>

      {tab === "subjects" ? <SubjectsPanel rows={subjectRows} /> : <RacksPanel rows={rackRows} />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "11px 26px",
        border: 0,
        borderRadius: 8,
        cursor: "pointer",
        font: "500 15px/1.2 var(--lib-font-sans)",
        background: active ? "var(--lib-white)" : "transparent",
        color: active ? "var(--lib-ink)" : "var(--lib-body-muted)",
      }}
    >
      {children}
    </button>
  );
}

function SubjectsPanel({ rows }: { rows: SubjectRow[] }) {
  const router = useRouter();
  const toast = useLibraryToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectRow | null>(null);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="lib-btn-primary"
          style={{ padding: "12px 22px", border: 0, borderRadius: 10, background: "var(--lib-primary)", color: "#fff", font: "600 15px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
        >
          + Add subject
        </button>
      </div>
      <TableShell>
        <thead>
          <tr style={{ background: "var(--lib-panel)" }}>
            <Th>Subject</Th>
            <Th>Titles</Th>
            <Th>Status</Th>
            <th style={{ padding: "14px 18px" }} />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={4} />}
          {rows.map((r) => (
            <tr key={r.id} className="lib-row-hover">
              <Td>
                <div style={{ font: "600 15px/1.4 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{r.name}</div>
              </Td>
              <Td mono>{r.count}</Td>
              <Td>
                <Pill label={r.status === "ACTIVE" ? "Active" : "Inactive"} tone={r.status === "ACTIVE" ? "green" : "red"} />
              </Td>
              <Td align="right" style={{ whiteSpace: "nowrap" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                  <button type="button" onClick={() => setEditing(r)} style={{ border: 0, background: "none", cursor: "pointer", font: "500 14px/1.2 var(--lib-font-sans)", color: "var(--lib-primary)" }}>
                    Edit
                  </button>
                  <ConfirmAction
                    title={r.status === "ACTIVE" ? "Deactivate subject" : "Activate subject"}
                    body={
                      r.status === "ACTIVE"
                        ? `Deactivate "${r.name}"? It will no longer be selectable on new books, but existing books keep the tag.`
                        : `Activate "${r.name}" again so it can be selected on books?`
                    }
                    cta={r.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    danger={r.status === "ACTIVE"}
                    onConfirm={async () => {
                      await updateCategoryAction(r.id, { status: r.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
                      toast.show(r.status === "ACTIVE" ? `${r.name} deactivated` : `${r.name} activated`);
                      router.refresh();
                    }}
                    trigger={(open) => (
                      <button type="button" onClick={open} style={{ border: 0, background: "none", cursor: "pointer", font: "500 14px/1.2 var(--lib-font-sans)", color: "var(--lib-red)" }}>
                        {r.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>

      <SubjectFormModal
        key="add"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add subject"
        initialName=""
        onSave={async (name) => {
          const fd = new FormData();
          fd.set("name", name);
          const result = await createCategoryAction({}, fd);
          if (result.error) return result.error;
          toast.show(`${name} added`);
          router.refresh();
          return undefined;
        }}
      />
      <SubjectFormModal
        key={editing?.id ?? "edit-empty"}
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit subject"
        initialName={editing?.name ?? ""}
        hint="Renaming retags every book filed under this subject."
        onSave={async (name) => {
          if (!editing) return undefined;
          await updateCategoryAction(editing.id, { name });
          toast.show(`Subject renamed to ${name}`);
          router.refresh();
          return undefined;
        }}
      />
    </>
  );
}

function SubjectFormModal({
  open,
  onClose,
  title,
  initialName,
  hint,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initialName: string;
  hint?: string;
  onSave: (name: string) => Promise<string | undefined>;
}) {
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  return (
    <LibraryModal open={open} onClose={onClose} title={title} width={560}>
      <form
        action={async () => {
          setPending(true);
          setError(undefined);
          const err = await onSave(name.trim());
          setPending(false);
          if (err) {
            setError(err);
            return;
          }
          onClose();
        }}
        style={{ padding: 26, display: "flex", flexDirection: "column", gap: 8 }}
      >
        {error && (
          <p role="alert" style={{ padding: "10px 14px", borderRadius: 11, background: "var(--lib-red-bg)", color: "var(--lib-red)", font: "500 14px/1.4 var(--lib-font-sans)" }}>
            {error}
          </p>
        )}
        <label htmlFor="subject-name" style={{ font: "600 14px/1.2 var(--lib-font-sans)", color: "var(--lib-primary)" }}>
          Name
        </label>
        <input
          id="subject-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          style={{ padding: "13px 15px", border: "1px solid var(--lib-field-border)", borderRadius: 10, font: "400 15px/1.2 var(--lib-font-sans)" }}
        />
        {hint && <span style={{ font: "400 13px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>{hint}</span>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 18 }}>
          <SecondaryButton type="button" onClick={onClose} disabled={pending}>
            Cancel
          </SecondaryButton>
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="lib-btn-primary"
            style={{ padding: "12px 28px", border: 0, borderRadius: 10, background: "var(--lib-primary)", color: "#fff", font: "600 15px/1.2 var(--lib-font-sans)", cursor: "pointer", opacity: pending ? 0.7 : 1 }}
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </LibraryModal>
  );
}

function RacksPanel({ rows }: { rows: RackRow[] }) {
  return (
    <>
      <p style={{ margin: 0, font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
        Racks are set per copy — open a book’s copies to assign or change where it sits on the shelf.
      </p>
      <TableShell>
        <thead>
          <tr style={{ background: "var(--lib-panel)" }}>
            <Th>Rack code</Th>
            <Th>Copies</Th>
            <Th>Subjects on this shelf</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={3} label="No copies have a shelf location yet." />}
          {rows.map((r) => (
            <tr key={r.code} className="lib-row-hover">
              <Td mono>{r.code}</Td>
              <Td mono>{r.copies}</Td>
              <Td>{r.subjects}</Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </>
  );
}
