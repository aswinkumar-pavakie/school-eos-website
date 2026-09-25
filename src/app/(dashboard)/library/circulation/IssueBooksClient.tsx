"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { searchActiveMembersAction, searchIssuableCopiesAction, type IssuableCopyHit, type MemberHit } from "../search-actions";
import { issueBookAction } from "./actions";
import { formatMoneySummary } from "@/lib/format";
import { useLibraryToast } from "@/components/library-ui/toast/ToastProvider";

type Role = "STUDENT" | "STAFF";

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ padding: "8px 18px", border: 0, borderRadius: 7, cursor: "pointer", font: "500 14px/1.2 var(--lib-font-sans)", background: active ? "var(--lib-white)" : "transparent", color: active ? "var(--lib-ink)" : "var(--lib-body-muted)" }}
    >
      {children}
    </button>
  );
}

const cardStyle: CSSProperties = { border: "1px solid var(--lib-border)", borderRadius: 14, padding: 22, display: "flex", flexDirection: "column", gap: 16 };
const searchBoxStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", border: "1px solid var(--lib-border)", borderRadius: 11 };
const hitButtonStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start", width: "100%", padding: "13px 16px", border: "1px solid var(--lib-border)", borderRadius: 11, background: "var(--lib-white)", cursor: "pointer", textAlign: "left" };

export function IssueBooksClient({ defaultDueDate, finePerDayPaise }: { defaultDueDate: string; finePerDayPaise: string | number }) {
  const router = useRouter();
  const toast = useLibraryToast();

  const [role, setRole] = useState<Role>("STUDENT");
  const [borrowerQuery, setBorrowerQuery] = useState("");
  const [borrowerHits, setBorrowerHits] = useState<MemberHit[]>([]);
  const [borrower, setBorrower] = useState<MemberHit | null>(null);

  const [bookQuery, setBookQuery] = useState("");
  const [bookHits, setBookHits] = useState<IssuableCopyHit[]>([]);
  const [pickedCopy, setPickedCopy] = useState<IssuableCopyHit | null>(null);

  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!borrowerQuery.trim()) {
        setBorrowerHits([]);
        return;
      }
      searchActiveMembersAction(borrowerQuery).then((hits) => setBorrowerHits(hits.filter((h) => h.memberType === role)));
    }, 300);
    return () => clearTimeout(timer);
  }, [borrowerQuery, role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!bookQuery.trim()) {
        setBookHits([]);
        return;
      }
      searchIssuableCopiesAction(bookQuery).then(setBookHits);
    }, 300);
    return () => clearTimeout(timer);
  }, [bookQuery]);

  const ready = !!borrower && !!pickedCopy;

  async function handleIssue() {
    if (!borrower || !pickedCopy) return;
    setIssuing(true);
    setError(undefined);
    const fd = new FormData();
    fd.set("copyId", pickedCopy.copyId);
    fd.set("memberId", borrower.id);
    const result = await issueBookAction({}, fd);
    setIssuing(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.show(`${pickedCopy.bookTitle} issued to ${borrower.name} · due ${dueDate}`);
    setBorrower(null);
    setBorrowerQuery("");
    setPickedCopy(null);
    setBookQuery("");
    router.refresh();
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20, alignItems: "start" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ font: "600 18px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>1. Borrower</div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2, padding: 3, borderRadius: 9, background: "var(--lib-divider)" }}>
              <TabButton active={role === "STUDENT"} onClick={() => setRole("STUDENT")}>
                Student
              </TabButton>
              <TabButton active={role === "STAFF"} onClick={() => setRole("STAFF")}>
                Staff
              </TabButton>
            </div>
          </div>

          {!borrower ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={searchBoxStyle}>
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#8593a8" strokeWidth={1.7}>
                  <circle cx="9" cy="9" r="5.6" />
                  <path d="M13.2 13.2L17 17" />
                </svg>
                <input
                  value={borrowerQuery}
                  onChange={(e) => setBorrowerQuery(e.target.value)}
                  placeholder="Search by name"
                  style={{ flex: 1, border: 0, outline: "none", font: "400 15px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)", background: "transparent" }}
                />
              </div>
              {borrowerHits.map((m) => (
                <button key={m.id} type="button" onClick={() => setBorrower(m)} className="lib-hit-hover" style={hitButtonStyle}>
                  <span style={{ font: "500 15px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{m.name}</span>
                  <span style={{ font: "400 13px/1.3 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>{m.memberType === "STUDENT" ? "Student" : "Staff"}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 11, background: "var(--lib-tint)" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ font: "500 16px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{borrower.name}</div>
                  <div style={{ font: "400 13px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>{borrower.memberType === "STUDENT" ? "Student" : "Staff"}</div>
                </div>
                <button type="button" onClick={() => { setBorrower(null); setBorrowerQuery(""); }} style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--lib-body-muted)", font: "400 18px/1 var(--lib-font-sans)" }}>
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ font: "600 18px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>2. Book</div>
          {!pickedCopy ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={searchBoxStyle}>
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#8593a8" strokeWidth={1.7}>
                  <circle cx="9" cy="9" r="5.6" />
                  <path d="M13.2 13.2L17 17" />
                </svg>
                <input
                  value={bookQuery}
                  onChange={(e) => setBookQuery(e.target.value)}
                  placeholder="Search by title, author or ISBN"
                  style={{ flex: 1, border: 0, outline: "none", font: "400 15px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)", background: "transparent" }}
                />
              </div>
              {bookHits.map((b) => (
                <button key={b.copyId} type="button" onClick={() => setPickedCopy(b)} className="lib-hit-hover" style={hitButtonStyle}>
                  <span style={{ font: "500 15px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{b.bookTitle}</span>
                  <span style={{ font: "400 13px/1.3 var(--lib-font-sans)", color: "var(--lib-body-muted)" }} className="lib-font-mono">
                    {b.copyCode}
                    {b.reservedForPickup ? " · held for a reservation" : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 11, background: "var(--lib-tint)" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ font: "500 16px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{pickedCopy.bookTitle}</div>
                <div className="lib-font-mono" style={{ font: "400 13px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
                  {pickedCopy.copyCode}
                  {pickedCopy.reservedForPickup ? " · held for a reservation" : ""}
                </div>
              </div>
              <button type="button" onClick={() => { setPickedCopy(null); setBookQuery(""); }} style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--lib-body-muted)", font: "400 18px/1 var(--lib-font-sans)" }}>
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, gap: 14 }}>
        <div style={{ font: "500 16px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>Due date</div>
        {error && <p style={{ margin: 0, font: "400 13.5px/1.4 var(--lib-font-sans)", color: "var(--lib-red)" }}>{error}</p>}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="lib-font-mono"
            style={{ padding: "13px 16px", border: "1px solid var(--lib-border)", borderRadius: 10, font: "400 15px/1.2 var(--lib-font-mono)", color: "var(--lib-ink)", background: "var(--lib-white)" }}
          />
          <button
            type="button"
            disabled={!ready || issuing}
            onClick={handleIssue}
            style={{
              padding: "14px 30px",
              border: 0,
              borderRadius: 10,
              cursor: ready ? "pointer" : "default",
              font: "600 15px/1.2 var(--lib-font-sans)",
              background: ready ? "var(--lib-navy)" : "var(--lib-tint)",
              color: ready ? "#fff" : "var(--lib-tertiary)",
            }}
          >
            ✓ {issuing ? "Issuing…" : "Issue book"}
          </button>
          <div style={{ font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
            {ready ? `Fine ${formatMoneySummary(finePerDayPaise)} per day if returned late.` : "Pick a borrower and an available copy to enable issuing."}
          </div>
        </div>
      </div>
    </>
  );
}
