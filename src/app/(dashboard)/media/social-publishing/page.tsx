import Link from "next/link";
import { redirect } from "next/navigation";
import { PlainButton } from "@/components/ui/Button";
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

export default async function SocialMediaPublishingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; year?: string; month?: string }>;
}) {
  const { tab, year, month } = await searchParams;
  const activeTab = TABS.some((t) => t.value === tab) ? tab! : "new";
  const now = new Date();
  const calendarYear = year ? Number(year) : now.getFullYear();
  const calendarMonth = month ? Number(month) : now.getMonth();

  try {
    const posts = await listMediaPosts();

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Social Media Publishing</h1>
            <p className="mt-1 text-sm text-text-muted">Publish to the Explore feed of the college mobile app and manage the comments students leave there.</p>
          </div>
          <div className="flex gap-1 rounded-[var(--radius-input)] border border-border bg-field p-1">
            {TABS.map((t) => (
              <Link key={t.value} href={`?tab=${t.value}`}>
                <PlainButton variant={activeTab === t.value ? "primary" : "secondary"} className={activeTab === t.value ? "" : "border-0 bg-transparent"}>
                  {t.label}
                </PlainButton>
              </Link>
            ))}
          </div>
        </div>

        {activeTab === "new" ? <CreatePostForm /> : null}
        {activeTab === "feed" ? <ExploreFeedPanel posts={posts} /> : null}
        {activeTab === "calendar" ? <ContentCalendarPanel posts={posts} year={calendarYear} month={calendarMonth} /> : null}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load social media publishing. Nothing was submitted — try again." />;
  }
}
