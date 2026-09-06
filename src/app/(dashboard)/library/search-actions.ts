"use server";

// Small live-search helpers shared by the Circulation "Issue a book" form and the
// book detail page's per-copy "Issue" action. Client components can't call apiFetch
// directly (this app's rule: the browser never calls the backend), so these Server
// Actions are the bridge -- called straight from a client component (not bound to a
// <form action=...>), same idea as src/components/dashboard/PersonPicker.tsx's debounced
// fetch, just via a Server Action instead of an internal API route.

import { listBookCopies, listBooks, listMembers } from "@/lib/library-api";

export interface IssuableCopyHit {
  copyId: string;
  copyCode: string;
  bookId: string;
  bookTitle: string;
  /** True for a copy held by a reservation's pickup window -- still shown (the
   * backend allows issuing it to whoever that reservation's for), just flagged
   * so a librarian doesn't hand it to the wrong member by mistake. */
  reservedForPickup: boolean;
}

/** Matches books by title/author/ISBN, then returns their AVAILABLE copies, plus
 * any RESERVED copy currently held for a ready pickup (the backend still allows
 * issuing that one -- only to the member whose reservation it's held for) --
 * capped small since this backs an incremental search dropdown, not a report. */
export async function searchIssuableCopiesAction(query: string): Promise<IssuableCopyHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const { data: books } = await listBooks({ search: q, status: "ACTIVE", limit: 6 });
  const hits: IssuableCopyHit[] = [];
  for (const book of books) {
    const copies = await listBookCopies(book.id);
    for (const copy of copies) {
      if (copy.status === "AVAILABLE" || copy.status === "RESERVED") {
        hits.push({
          copyId: copy.id,
          copyCode: copy.copyCode,
          bookId: book.id,
          bookTitle: book.title,
          reservedForPickup: copy.status === "RESERVED",
        });
        if (hits.length >= 20) return hits;
      }
    }
  }
  return hits;
}

export interface MemberHit {
  id: string;
  name: string;
  memberType: string;
}

/** Matches Library members by name -- active members only, since only they can
 * have a book issued to them. */
export async function searchActiveMembersAction(query: string): Promise<MemberHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const { data: members } = await listMembers({ search: q, status: "ACTIVE", limit: 10 });
  return members.map((m) => ({ id: m.id, name: [m.firstName, m.lastName].filter(Boolean).join(" "), memberType: m.memberType }));
}
