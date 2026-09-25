import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { DiscoveryClient } from "./DiscoveryClient";

export default async function NewMessagePage() {
  try {
    const actor = await getCurrentActor();
    return <DiscoveryClient personId={actor.personId} />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load people. Nothing was changed -- try again." />;
  }
}
