// Social Media Publishing -- pixel-rebuilt from the design's own isSocial
// screen. Real media_post data (listMediaPosts/createMediaPost/etc, already
// fully built) -- only the visual layer changes here. The design's own
// "Content calendar" pill is a plain go.calendar redirect to the Academic
// Calendar screen in the source; this app already has a genuinely richer,
// real, working Content calendar tab (its own per-day post view) built on
// top of that idea, so it's kept as a real third tab rather than downgraded
// to match the mockup's simpler placeholder.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listMediaPosts } from "@/lib/media-api";
import { CreatePostForm } from "./CreatePostForm";
import { ExploreFeedPanel } from "./ExploreFeedPanel";
import { ContentCalendarPanel } from "./ContentCalendarPanel";

const TABS = [
  { value: "new", label: "New post" },
  { value: "feed", label: "App Explore feed" },
  { value: "calendar", label: "Content calendar" },
] as const;

export default async function SocialMediaPublishingPage({ searchParams }: { searchParams: Promise<{ tab?: string; year?: string; month?: string }> }) {
  const { tab, year, month } = await searchParams;
  const activeTab = TABS.some((t) => t.value === tab) ? tab! : "new";
  const now = new Date();
  const calendarYear = year ? Number(year) : now.getFullYear();
  const calendarMonth = month ? Number(month) : now.getMonth();

  try {
    const posts = await listMediaPosts();

    return (
      <div className="media-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.1 }}>Social Media Publishing</div>
            <div style={{ fontSize: 15.5, color: "var(--med-body-muted)", marginTop: 10 }}>Publish to the Explore feed of the school app and manage the comments students leave there</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--med-border)", borderRadius: 12, padding: 4, flexShrink: 0 }}>
            {TABS.map((t) => {
              const active = activeTab === t.value;
              return (
                <Link key={t.value} href={`?tab=${t.value}`} style={{ textDecoration: "none" }}>
                  <span style={{ display: "inline-block", borderRadius: 9, padding: "10px 16px", fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", background: active ? "var(--med-navy)" : "transparent", color: active ? "#fff" : "var(--med-ink)" }}>
                    {t.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {activeTab === "new" && <CreatePostForm />}
        {activeTab === "feed" && <ExploreFeedPanel posts={posts} />}
        {activeTab === "calendar" && <ContentCalendarPanel posts={posts} year={calendarYear} month={calendarMonth} />}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load social media publishing."} />;
  }
}
