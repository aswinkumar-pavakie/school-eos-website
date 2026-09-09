import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import {
  listEquipmentIndents,
  listMyEquipment,
  listMyTeams,
  listOutstandingIssues,
  listOverdueIssues,
} from "@/lib/sports-faculty-api";
import { EquipmentPanel } from "./EquipmentPanel";

export default async function EquipmentPage() {
  try {
    const [equipment, outstandingIssues, overdueIssues, indents, teams] = await Promise.all([
      listMyEquipment(),
      listOutstandingIssues(),
      listOverdueIssues(),
      listEquipmentIndents().catch(() => []),
      listMyTeams(),
    ]);

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Equipment</h1>
          <p className="mt-1 text-sm text-text-muted">Issue/return against your sports&apos; equipment, and request restocks.</p>
        </div>
        <EquipmentPanel
          equipment={equipment}
          outstandingIssues={outstandingIssues}
          overdueIssueIds={overdueIssues.map((i) => i.id)}
          indents={indents}
          teams={teams}
        />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load equipment. Nothing was submitted — try again." />;
  }
}
