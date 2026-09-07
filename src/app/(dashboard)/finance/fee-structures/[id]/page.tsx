import { FeeStructureDetailView } from "../../_shared/FeeStructureDetailView";

export default async function FeeStructureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FeeStructureDetailView id={id} />;
}
