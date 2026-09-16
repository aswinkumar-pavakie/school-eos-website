import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyRow, StatusPill, TableShell, Td, Th, type PillTone } from "@/components/hostel-warden-ui/primitives";
import { formatDate } from "@/lib/format";
import { HOSTEL_ISSUE_TYPE_LABELS, listComplaints, listHostelStructure, type HostelComplaintState, type HostelIssueType } from "@/lib/hostel-warden-api";
import { NewComplaintForm } from "./NewComplaintForm";
import { StatusTransition } from "./StatusTransition";

const TONE: Record<HostelComplaintState, PillTone> = {
  OPEN: "amber",
  IN_PROGRESS: "blue",
  ESCALATED: "red",
  RESOLVED: "gray",
  CLOSED: "gray",
  REJECTED: "red",
};

export default async function IssuesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const needle = (q ?? "").trim().toLowerCase();

  try {
    const [complaints, blocks] = await Promise.all([listComplaints(), listHostelStructure()]);
    const blockName = new Map(blocks.map((b) => [b.id, b.name]));
    const rows = complaints
      .filter((c) => !needle || `${c.subject} ${c.description}`.toLowerCase().includes(needle))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <NewComplaintForm blocks={blocks} />
        </div>

        <div className="hw-lift" style={{ border: "1px solid var(--hw-divider)", borderRadius: "var(--hw-radius-md)", overflow: "hidden" }}>
          <TableShell>
            <thead>
              <tr>
                <Th>Issue</Th>
                <Th>Type</Th>
                <Th>Location</Th>
                <Th>Raised</Th>
                <Th>Status</Th>
                <Th align="right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="hw-row-hover">
                  <Td>
                    <span style={{ display: "block", fontWeight: 600 }}>{c.subject}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--hw-text-faint)" }}>{c.description}</span>
                  </Td>
                  <Td style={{ color: "var(--hw-text-muted)" }}>{HOSTEL_ISSUE_TYPE_LABELS[c.issueType as HostelIssueType] ?? c.issueType}</Td>
                  <Td style={{ color: "var(--hw-text-muted)" }}>{c.blockId ? blockName.get(c.blockId) ?? "—" : "—"}</Td>
                  <Td style={{ whiteSpace: "nowrap", color: "var(--hw-text-muted)" }}>{formatDate(c.createdAt)}</Td>
                  <Td>
                    <StatusPill label={c.state.replace("_", " ")} tone={TONE[c.state]} />
                  </Td>
                  <Td align="right">
                    <StatusTransition id={c.id} state={c.state} />
                  </Td>
                </tr>
              ))}
              {rows.length === 0 && <EmptyRow colSpan={6} label={needle ? "No issues match that search." : "No issues logged yet."} />}
            </tbody>
          </TableShell>
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load issues."} />;
  }
}
