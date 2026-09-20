import { ErrorState } from "@/components/ui/EmptyState";
import { listComplaints, listHostelStructure } from "@/lib/hostel-warden-api";
import { IssuesView, type IssueRow } from "./IssuesView";
import { NewComplaintForm } from "./NewComplaintForm";

export default async function IssuesPage() {
  try {
    const [complaints, blocks] = await Promise.all([listComplaints(), listHostelStructure()]);
    const blockName = new Map(blocks.map((b) => [b.id, b.name]));

    const rows: IssueRow[] = complaints
      .map((c) => ({
        id: c.id,
        subject: c.subject,
        description: c.description,
        issueType: c.issueType,
        blockName: c.blockId ? blockName.get(c.blockId) ?? null : null,
        createdAt: c.createdAt,
        state: c.state,
      }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <NewComplaintForm blocks={blocks} />
        <IssuesView rows={rows} />
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load issues."} />;
  }
}
