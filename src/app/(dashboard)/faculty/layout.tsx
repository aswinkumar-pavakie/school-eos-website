import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FacultyShell } from "@/components/faculty-ui/FacultyShell";
import { buildFacultyNavGroups } from "@/components/faculty-ui/nav-items";
import type { MessengerThread } from "@/components/faculty-ui/messenger/Messenger";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { getCoordinatorMe } from "@/lib/faculty-coordinator-api";
import { listAdvisorSections, listStudentLeaveRequests, listTeachingOfferings } from "@/lib/faculty-api";
import { listMyTeams } from "@/lib/sports-faculty-api";
import { listConversations } from "@/lib/faculty-messages-api";
import { listEvents } from "@/lib/faculty-permissions-api";
import { isUpcoming } from "@/lib/faculty-time";
import { E2eeBootstrapMount } from "@/lib/e2ee/E2eeBootstrapMount";
import { loadMessagesAction, sendMessageAction } from "./message/actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function FacultyLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const actorOrNull = await getCurrentActor().catch(() => null);
  if (!actorOrNull || !actorOrNull.roles.includes("FACULTY")) redirect("/login");
  const actor = actorOrNull;

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  // Real, live checks -- never cached, never assumed from a role on the login
  // token. Same posture the previous flat-nav layout already established.
  const [coordinatorMe, myTeams, sections, pendingLeave, conversations, offerings, events] = await Promise.all([
    getCoordinatorMe().catch(() => ({ isCoordinator: false })),
    listMyTeams().catch(() => []),
    listAdvisorSections().catch(() => []),
    listStudentLeaveRequests()
      .then((rows) => rows.filter((r) => r.state === "PENDING").length)
      .catch(() => 0),
    // Feeds the global "Message parents" modal (topbar, every screen) --
    // same real legacy /messages data the full Message screen itself uses.
    listConversations().catch(() => []),
    listTeachingOfferings().catch(() => []),
    // Real: /faculty/events -- badge = upcoming (not-yet-past) consent
    // requests needing attention, same convention as the leave badge.
    listEvents().catch(() => []),
  ]);
  const pendingPermissions = events.filter((e) => isUpcoming(e.endsAt)).length;

  const messengerThreads: MessengerThread[] = conversations.map((c) => ({
    id: c.id,
    name: c.student?.name ?? c.directParticipant?.name ?? "Conversation",
    sub: c.student ? `Parent of ${c.student.name}${c.grade ? ` · ${c.grade.name}-${c.section?.name}` : ""}` : "",
    classLabel: c.grade && c.section ? `${c.grade.name}-${c.section.name}` : null,
    lastMessageAt: c.lastMessageAt,
    lastMessagePreview: c.lastMessage?.body ?? "No messages yet",
    unreadCount: c.unreadCount,
  }));
  const messengerClassFilters = [...new Set(offerings.map((o) => `${o.gradeName}-${o.sectionName}`))];

  async function onLoadMessages(conversationId: string) {
    "use server";
    const messages = await loadMessagesAction(conversationId);
    return messages.map((m) => ({ id: m.id, text: m.body, createdAt: m.createdAt, fromMe: m.senderId === actor.personId }));
  }
  async function onSendMessage(conversationId: string, body: string) {
    "use server";
    const result = await sendMessageAction(conversationId, body);
    return { error: result.error };
  }

  // "8-B", "9-A" etc -- the design's own "MY CLASS · 8-B" / "Class teacher ·
  // 8-B" convention. A faculty member with multiple advised sections (rare)
  // just shows the first here; each screen needing a specific section still
  // resolves it independently via listAdvisorSections(), same as before.
  const sectionLabel = sections[0] ? `${sections[0].gradeName}-${sections[0].sectionName}` : null;
  const sectionRoleLabel = sectionLabel ? `Class teacher · ${sectionLabel}` : "Faculty";

  // Display-only "2026–27"-style label for the topbar pill -- ScopedSection's
  // own academicYearId is an opaque id, not a display label, and there's no
  // FACULTY-authorized academic-year label endpoint today. Derived from the
  // current date (India's academic year runs June-May) rather than adding a
  // new backend dependency for a cosmetic pill.
  const now = new Date();
  const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const academicYear = `${startYear}–${String(startYear + 1).slice(-2)}`;

  const navGroups = buildFacultyNavGroups({
    sectionLabel,
    pendingLeaveCount: pendingLeave,
    pendingPermissionsCount: pendingPermissions,
    // Fees has no real FACULTY-authorized backend at all (confirmed both in
    // the backend's own @Roles() decorators and in the mobile app, which has
    // no fee-related faculty lib file either) -- badge stays unset, never a
    // placeholder count.
    isCoordinator: coordinatorMe.isCoordinator,
    hasSportsTeams: myTeams.length > 0,
  });

  return (
    <>
      <E2eeBootstrapMount personId={actor.personId} />
      <FacultyShell
        personName={personName}
        sectionRoleLabel={sectionRoleLabel}
        academicYear={academicYear}
        navGroups={navGroups}
        messengerThreads={messengerThreads}
        messengerClassFilters={messengerClassFilters}
        onLoadMessages={onLoadMessages}
        onSendMessage={onSendMessage}
      >
        {children}
      </FacultyShell>
    </>
  );
}
