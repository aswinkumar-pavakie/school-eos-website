import { PurchaseRequestDetailView } from "../../_shared/PurchaseRequestDetailView";

export default async function PurchaseRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PurchaseRequestDetailView id={id} />;
}
