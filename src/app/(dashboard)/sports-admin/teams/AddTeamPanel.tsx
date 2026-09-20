"use client";

// Sports Admin -> Teams & squads -- "+ Add squad" panel, matching the
// design's own modal but wired to real createTeam()/listSports()/
// listSportCategories()/listCoaches() calls (Faculty's own /sports/teams
// module reused unchanged -- SPORTS_ADMIN is just authorized for every
// sport now, see sports-faculty.repository.ts). Academic year is resolved
// server-side to the current one in actions.ts, matching the design's own
// "always current year" assumption -- no year picker in the mock.

import { useActionState, useEffect, useState } from "react";
import { PrimaryButton, SecondaryButton, FieldLabel, TextInput, Select } from "@/components/sports-ui/primitives";
import type { Coach, Sport, SportCategory } from "@/lib/sports-admin-api";
import { createTeamAction, type FormState } from "./actions";

// Client-side pickers here MUST NOT call sports-admin-api.ts functions
// directly -- those need the httpOnly access-token cookie via next/headers'
// cookies(), which only works in a server context. This component fetches
// its own small Route Handlers instead (src/app/api/sports-admin/*), same
// pattern the app's existing StudentPersonPicker already uses.
async function fetchJson<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) return [];
  const body = (await res.json()) as { data: T[] };
  return body.data;
}

const initial: FormState = {};

export function AddTeamPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createTeamAction, initial);

  const [sports, setSports] = useState<Sport[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [categories, setCategories] = useState<SportCategory[]>([]);
  const [selectedSportId, setSelectedSportId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([fetchJson<Sport>("/api/sports-admin/sports"), fetchJson<Coach>("/api/sports-admin/coaches")])
      .then(([s, c]) => {
        setSports(s);
        setCoaches(c);
        setSelectedSportId((prev) => prev || s[0]?.id || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!selectedSportId) {
      setCategories([]);
      return;
    }
    fetchJson<SportCategory>(`/api/sports-admin/sport-categories?sportId=${selectedSportId}`)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [selectedSportId]);

  if (!open) {
    return (
      <PrimaryButton type="button" onClick={() => setOpen(true)}>
        + Add squad
      </PrimaryButton>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 420 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>New squad</div>
      <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <FieldLabel>Sport</FieldLabel>
          <Select name="sportId" required value={selectedSportId} onChange={(e) => setSelectedSportId(e.target.value)} disabled={loading}>
            {sports.length === 0 && <option value="">{loading ? "Loading…" : "No sports found"}</option>}
            {sports.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <FieldLabel>Squad name</FieldLabel>
          <TextInput name="name" required placeholder="e.g. U16 Boys Football" />
        </div>

        <div>
          <FieldLabel>Age group / category</FieldLabel>
          <Select name="sportCategoryId" defaultValue="">
            <option value="">Not set</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.ageGroup ? ` · ${c.ageGroup}` : ""}</option>
            ))}
          </Select>
        </div>

        <div>
          <FieldLabel>In-charge coach</FieldLabel>
          <Select name="coachId" defaultValue="">
            <option value="">Not assigned yet</option>
            {coaches.filter((c) => c.status === "ACTIVE").map((c) => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </Select>
        </div>

        {state.error && (
          <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>
            {state.error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Create squad</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
