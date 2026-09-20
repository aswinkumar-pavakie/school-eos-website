"use client";

import { useState } from "react";
import { Card } from "@/components/hostel-warden-ui/primitives";

export interface BlockSummary {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  roomCount: number;
  wardenName: string | null;
}

export interface RoomTile {
  id: string;
  roomNo: string;
  floorNo: number;
  filled: number;
  capacity: number;
}

export function RoomsView({ blocks, roomsByBlock }: { blocks: BlockSummary[]; roomsByBlock: Record<string, RoomTile[]> }) {
  const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id ?? null);
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {blocks.map((b) => {
          const percent = b.capacity > 0 ? Math.round((b.occupied / b.capacity) * 100) : 0;
          const active = b.id === selectedId;
          return (
            <Card
              key={b.id}
              lift={false}
              style={{
                padding: "16px 18px",
                cursor: "pointer",
                border: active ? "1px solid var(--hw-accent)" : "1px solid var(--hw-divider)",
                background: active ? "var(--hw-accent-100)" : "#fff",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedId(active ? null : b.id)}
                style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ flex: 1, fontWeight: 800, fontSize: 16 }}>{b.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--hw-accent-700)" }}>{percent}% full</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "var(--hw-divider)", marginTop: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, background: "var(--hw-accent)", width: `${percent}%` }} />
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--hw-text-faint)", fontWeight: 700, textTransform: "uppercase" }}>Beds vacant</div>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{Math.max(0, b.capacity - b.occupied)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--hw-text-faint)", fontWeight: 700, textTransform: "uppercase" }}>Rooms</div>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{b.roomCount}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--hw-text-muted)" }}>Warden · {b.wardenName ?? "Not assigned"}</div>
              </button>
            </Card>
          );
        })}
        {blocks.length === 0 && <div style={{ fontSize: 13, color: "var(--hw-text-muted)" }}>No hostel blocks are registered for this warden yet.</div>}
      </div>

      {selected && (
        <Card style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="hw-btn-secondary"
              style={{ height: 32, padding: "0 12px", borderRadius: 8, border: "1px solid var(--hw-border-input)", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              × Close room list
            </button>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{selected.name} — bed allocation heat map</h3>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: "var(--hw-text-faint)" }}>All rooms shown below</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {(roomsByBlock[selected.id] ?? []).map((room) => {
              const full = room.capacity > 0 && room.filled >= room.capacity;
              const empty = room.filled === 0;
              const bg = empty ? "#ffffff" : full ? "var(--hw-accent)" : "var(--hw-accent-300)";
              const fg = empty ? "var(--hw-accent-900)" : full ? "#ffffff" : "var(--hw-accent-900)";
              const bd = empty ? "#dde2e8" : full ? "var(--hw-accent)" : "var(--hw-accent-300)";
              const sharing = room.capacity === 1 ? "Single sharing" : room.capacity === 2 ? "Double sharing" : room.capacity === 3 ? "Triple sharing" : room.capacity >= 4 ? "Four sharing" : "—";
              return (
                <div key={room.id} className="hw-lift" style={{ border: `1px solid ${bd}`, background: bg, color: fg, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{room.roomNo}</div>
                  <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 2 }}>{room.filled}/{room.capacity} beds filled</div>
                  <div style={{ fontSize: 11, opacity: 0.75 }}>{sharing}</div>
                </div>
              );
            })}
            {(roomsByBlock[selected.id] ?? []).length === 0 && (
              <div style={{ fontSize: 13, color: "var(--hw-text-muted)" }}>No rooms registered in this block.</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
