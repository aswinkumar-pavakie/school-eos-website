import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { RequestsInboxClient } from "./RequestsInboxClient";

export default async function ParentMessageRequestsPage() {
  try {
    await getCurrentActor();
    return (
      <div className="parent-scope">
        <RequestsInboxClient />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load requests." />;
  }
}
