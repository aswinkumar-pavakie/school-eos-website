"use client";

import { useActionState, useEffect, useState } from "react";
import { StatusPill, TextInput, PrimaryButton, SecondaryButton, type PillTone } from "@/components/media-ui/primitives";
import { formatDate, formatMoneySummary } from "@/lib/format";
import type { InventoryItemStatus, MediaInventoryHistoryEntry, MediaInventoryItem, MediaTeamMember } from "@/lib/media-api";
import {
  issueAssetAction,
  loadInventoryHistoryAction,
  markAvailableAction,
  markLostAction,
  retireAssetAction,
  returnAssetAction,
  sendToServiceAction,
  updateMediaInventoryItemAction,
  type FormState,
} from "./actions";

const editInitial: FormState = {};

const STATUS_TONE: Record<InventoryItemStatus, PillTone> = {
  AVAILABLE: "green",
  ASSIGNED: "blue",
  DAMAGED: "amber",
  LOST: "red",
  RETIRED: "gray",
};

const ACTION_LABEL: Record<string, string> = {
  INVENTORY_ITEM_CREATED: "Added to inventory",
  INVENTORY_ITEM_UPDATED: "Details updated",
  INVENTORY_ITEM_STOCK_ADDED: "Stock added",
  INVENTORY_ITEM_STOCK_ADJUSTED: "Stock adjusted",
  INVENTORY_ITEM_ISSUED: "Issued",
  INVENTORY_ITEM_RETURNED: "Returned",
  INVENTORY_ITEM_TRANSFERRED: "Transferred",
  INVENTORY_ITEM_MARKED_DAMAGED: "Sent to service",
  INVENTORY_ITEM_MARKED_AVAILABLE: "Repair completed",
  INVENTORY_ITEM_MARKED_LOST: "Marked lost",
  INVENTORY_ITEM_RETIRED: "Retired",
};

export function InventoryRow({ item, crew }: { item: MediaInventoryItem; crew: MediaTeamMember[] }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<MediaInventoryHistoryEntry[] | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [editState, editFormAction] = useActionState(updateMediaInventoryItemAction.bind(null, item.id), editInitial);

  useEffect(() => {
    if (open && history === null) {
      loadInventoryHistoryAction(item.id).then(setHistory);
    }
  }, [open, history, item.id]);

  const timesIssued = history?.filter((h) => h.action === "INVENTORY_ITEM_ISSUED").length ?? 0;
  const crewWithAccount = crew.filter((c) => c.personId);

  async function handleIssue() {
    if (!assignee) return;
    setPending(true);
    setError(undefined);
    const result = await issueAssetAction(item.id, assignee);
    setPending(false);
    if (result.error) setError(result.error);
    else setIssuing(false);
  }

  async function handleReturn() {
    setPending(true);
    const result = await returnAssetAction(item.id);
    setPending(false);
    if (result.error) setError(result.error);
  }

  async function handleService() {
    setPending(true);
    const result = await sendToServiceAction(item.id);
    setPending(false);
    if (result.error) setError(result.error);
  }

  async function handleMarkAvailable() {
    setPending(true);
    const result = await markAvailableAction(item.id);
    setPending(false);
    if (result.error) setError(result.error);
  }

  async function handleMarkLost() {
    if (!confirm(`Mark "${item.name}" as lost? This can be reversed later from Lost by marking it found.`)) return;
    setPending(true);
    const result = await markLostAction(item.id);
    setPending(false);
    if (result.error) setError(result.error);
  }

  async function handleRetire() {
    if (!confirm(`Retire "${item.name}"? Retired assets can no longer change status.`)) return;
    setPending(true);
    const result = await retireAssetAction(item.id);
    setPending(false);
    if (result.error) setError(result.error);
  }

  // The one direct "change status" control -- picks among every real status
  // this item can move to from wherever it is now (never every status
  // unconditionally: MLS-style unsafe jumps like DAMAGED -> ASSIGNED are
  // deliberately excluded). ASSIGNED needs an assignee first, so selecting it
  // opens the same picker the "Issue" flow already uses rather than firing
  // immediately.
  async function handleStatusSelect(next: InventoryItemStatus) {
    if (next === item.status || item.status === "RETIRED") return;
    setError(undefined);
    if (next === "ASSIGNED") {
      setOpen(true);
      setEditing(false);
      setIssuing(true);
      return;
    }
    if (next === "LOST" && !confirm(`Mark "${item.name}" as lost?`)) return;
    if (next === "RETIRED" && !confirm(`Retire "${item.name}"? Retired assets can no longer change status.`)) return;

    setPending(true);
    let result: { error?: string };
    if (next === "AVAILABLE") {
      result = item.status === "ASSIGNED" ? await returnAssetAction(item.id) : await markAvailableAction(item.id);
    } else if (next === "DAMAGED") {
      result = await sendToServiceAction(item.id);
    } else if (next === "LOST") {
      result = await markLostAction(item.id);
    } else {
      result = await retireAssetAction(item.id);
    }
    setPending(false);
    if (result.error) setError(result.error);
  }

  const STATUS_OPTIONS: { value: InventoryItemStatus; label: string }[] = [
    { value: "AVAILABLE", label: "Available" },
    { value: "ASSIGNED", label: "Issued" },
    { value: "DAMAGED", label: "In service" },
    { value: "LOST", label: "Lost" },
    { value: "RETIRED", label: "Retired" },
  ];

  return (
    <div>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ display: "grid", gridTemplateColumns: "1.1fr 1.7fr 1fr 1.2fr 1fr 0.9fr", gap: 16, padding: "16px 26px", borderBottom: "1px solid var(--med-divider-2)", alignItems: "center", cursor: "pointer" }}
      >
        <span style={{ fontFamily: "var(--med-mono)", fontSize: 13.5, color: "var(--med-primary)", fontWeight: 600 }}>{item.assetCode ?? "—"}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{item.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--med-body-muted)", marginTop: 2 }}>{item.description ?? "—"}</div>
        </div>
        <span style={{ fontSize: 14, color: "var(--med-body)" }}>{item.categoryName}</span>
        <span style={{ fontSize: 14, color: "var(--med-ink)" }}>{item.assignedToName ?? item.location ?? "—"}</span>
        <span style={{ fontSize: 14, color: "var(--med-body)" }}>{item.status === "DAMAGED" ? "In service" : "Good"}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
          {item.status === "RETIRED" ? (
            <StatusPill label="RETIRED" tone={STATUS_TONE.RETIRED} />
          ) : (
            <select
              value={item.status}
              disabled={pending}
              onChange={(e) => handleStatusSelect(e.target.value as InventoryItemStatus)}
              style={{
                height: 30,
                borderRadius: 20,
                border: "1px solid var(--med-border)",
                background: STATUS_TONE[item.status] === "green" ? "var(--med-green-bg)" : STATUS_TONE[item.status] === "blue" ? "var(--med-tint)" : STATUS_TONE[item.status] === "amber" ? "var(--med-amber-bg)" : "var(--med-red-bg)",
                color: "var(--med-ink)",
                fontSize: 12.5,
                fontWeight: 700,
                padding: "0 8px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(true); setEditing((v) => !v); }}
            className="media-btn-hover-ghost"
            style={{ height: 30, padding: "0 10px", borderRadius: 7, border: "1px solid var(--med-border)", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--med-primary)", fontFamily: "inherit" }}
          >
            {editing ? "Close" : "Edit"}
          </button>
        </div>
      </div>

      {error && !open && <div style={{ padding: "0 26px 12px 26px", fontSize: 12.5, color: "var(--med-red)", fontWeight: 600 }}>{error}</div>}

      {open && editing && (
        <div style={{ padding: "18px 26px 22px 26px", background: "#fff", borderBottom: "1px solid var(--med-divider-2)" }}>
          <form action={editFormAction}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
              <TextInput name="name" defaultValue={item.name} placeholder="Equipment name" style={{ marginTop: 0 }} />
              <TextInput name="assetCode" defaultValue={item.assetCode ?? ""} placeholder="Asset tag" style={{ marginTop: 0 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
              <TextInput name="location" defaultValue={item.location ?? ""} placeholder="Location" style={{ marginTop: 0 }} />
              <TextInput name="vendor" defaultValue={item.vendor ?? ""} placeholder="Vendor" style={{ marginTop: 0 }} />
            </div>
            <TextInput name="description" defaultValue={item.description ?? ""} placeholder="Description" style={{ marginTop: 12 }} />
            {editState.error && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 12.5, fontWeight: 600 }}>{editState.error}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <SecondaryButton type="button" onClick={() => setEditing(false)} style={{ height: 40, padding: "0 16px", fontSize: 13 }}>Cancel</SecondaryButton>
              <PrimaryButton type="submit" style={{ height: 40, padding: "0 18px", fontSize: 13 }}>Save changes</PrimaryButton>
            </div>
          </form>
        </div>
      )}

      {open && !editing && (
        <div style={{ padding: "4px 26px 24px 26px", background: "#fff", borderBottom: "1px solid var(--med-divider-2)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 26, paddingTop: 18 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary)" }}>ASSET DETAILS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: "var(--med-body-muted)" }}>Purchased</span><b>{item.acquisitionDate ? formatDate(item.acquisitionDate) : "—"}</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: "var(--med-body-muted)" }}>Invoice value</span><b>{item.acquisitionCostPaise ? formatMoneySummary(String(item.acquisitionCostPaise)) : "—"}</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: "var(--med-body-muted)" }}>Assigned to</span><b>{item.assignedToName ?? "—"}</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: "var(--med-body-muted)" }}>Times issued</span><b>{history ? timesIssued : "…"}</b></div>
              </div>

              {error && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 12.5, fontWeight: 600 }}>{error}</div>}

              {issuing ? (
                <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                  <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={{ flex: 1, height: 42, border: "1px solid var(--med-input-border)", borderRadius: 10, padding: "0 10px", fontSize: 13.5, fontFamily: "inherit" }}>
                    <option value="">Select crew member…</option>
                    {crewWithAccount.map((c) => (
                      <option key={c.id} value={c.personId!}>{c.fullName}</option>
                    ))}
                  </select>
                  <button type="button" disabled={pending || !assignee} onClick={handleIssue} style={{ height: 42, padding: "0 16px", borderRadius: 10, border: 0, background: "var(--med-navy)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Confirm</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                  {item.status === "AVAILABLE" && (
                    <button type="button" onClick={() => setIssuing(true)} style={{ height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid var(--med-border)", background: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Issue</button>
                  )}
                  {item.status === "ASSIGNED" && (
                    <button type="button" disabled={pending} onClick={handleReturn} style={{ height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid var(--med-border)", background: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Mark returned</button>
                  )}
                  {(item.status === "AVAILABLE" || item.status === "ASSIGNED") && (
                    <button type="button" disabled={pending} onClick={handleService} style={{ height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid var(--med-border)", background: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Send to service</button>
                  )}
                  {(item.status === "DAMAGED" || item.status === "LOST") && (
                    <button type="button" disabled={pending} onClick={handleMarkAvailable} style={{ height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid var(--med-border)", background: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", color: "var(--med-green)" }}>
                      {item.status === "DAMAGED" ? "Mark repaired" : "Mark found"}
                    </button>
                  )}
                  {item.status !== "LOST" && item.status !== "RETIRED" && (
                    <button type="button" disabled={pending} onClick={handleMarkLost} style={{ height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid var(--med-border)", background: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", color: "var(--med-red)" }}>Mark lost</button>
                  )}
                  {item.status !== "RETIRED" && (
                    <button type="button" disabled={pending} onClick={handleRetire} style={{ height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid var(--med-border)", background: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", color: "var(--med-tertiary)" }}>Retire</button>
                  )}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary)" }}>MOVEMENT HISTORY</div>
              <div style={{ display: "flex", flexDirection: "column", marginTop: 10 }}>
                {history === null ? (
                  <div style={{ fontSize: 13, color: "var(--med-tertiary)", padding: "11px 0" }}>Loading…</div>
                ) : history.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--med-tertiary)", padding: "11px 0" }}>No recorded activity yet.</div>
                ) : (
                  history.map((h) => (
                    <div key={h.id} style={{ display: "flex", gap: 14, padding: "11px 0", borderBottom: "1px solid var(--med-divider)" }}>
                      <span style={{ fontFamily: "var(--med-mono)", fontSize: 12.5, color: "var(--med-tertiary)", width: 86, flexShrink: 0 }}>{formatDate(h.date)}</span>
                      <span style={{ fontSize: 13.5, flex: 1 }}>{ACTION_LABEL[h.action] ?? h.action}{h.actorName ? ` · ${h.actorName}` : ""}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
