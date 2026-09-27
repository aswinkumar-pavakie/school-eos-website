import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { DiscoveryClient } from "./DiscoveryClient";

export default async function NewParentMessagePage() {
  try {
    const actor = await getCurrentActor();
    return (
      <div className="parent-scope">
        <DiscoveryClient personId={actor.personId} />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load people." />;
  }
}
