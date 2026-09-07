import { ConcessionDetailView } from "../../_shared/ConcessionDetailView";

// Reached from the Concessions list's "Approval →" link and from a concession-type
// approval's own "View underlying record →" link — this is the one page both point to.
export default async function ConcessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConcessionDetailView id={id} />;
}
