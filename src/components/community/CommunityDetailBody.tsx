"use client";

// Owns the one bit of shared state the reference design needs across
// components on this page: the header's "+ New post" button opens the same
// form the "Posts to parents" panel renders below.

import { useState } from "react";
import { MembersPanel } from "./MembersPanel";
import { PositionsPanel } from "./PositionsPanel";
import { PostsToParentsPanel } from "./PostsToParentsPanel";
import type { PositionRow } from "./PositionsPanel";

interface MembershipRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  studentGradeName: string | null;
  studentSectionName: string | null;
  status: string;
}
interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  state: string;
  publishedAt: string | null;
}

export function CommunityDetailBody({
  communityId,
  category,
  name,
  description,
  advisor,
  memberCap,
  memberships,
  positions,
  announcements,
}: {
  communityId: string;
  category: string;
  name: string;
  description: string;
  advisor: string;
  memberCap: number | null;
  memberships: MembershipRow[];
  positions: PositionRow[];
  announcements: AnnouncementRow[];
}) {
  const [postFormOpen, setPostFormOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-[6px] bg-primary/10 px-2 py-[3px] text-[11px] font-bold text-primary">{category}</span>
          <h1 className="mt-2.5 text-[32px] font-extrabold leading-[1.1] tracking-[-0.015em] text-text">{name}</h1>
          {description && <p className="mt-2 max-w-[640px] text-[15px] text-text-muted">{description}</p>}
          <p className="mt-2 text-[13.5px] text-text-muted">
            Teacher in-charge · {advisor} · capacity {memberCap ?? "unlimited"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPostFormOpen(true)}
          className="whitespace-nowrap rounded-[9px] bg-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          + New post
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <MembersPanel communityId={communityId} memberCap={memberCap} memberships={memberships} />
        <PositionsPanel communityId={communityId} positions={positions} />
      </div>

      <PostsToParentsPanel
        communityId={communityId}
        announcements={announcements}
        open={postFormOpen}
        onClose={() => setPostFormOpen(false)}
      />
    </>
  );
}
