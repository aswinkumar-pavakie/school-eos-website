import { OrderTrackingView } from "../_shared/OrderTrackingView";

export default async function SopTrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>;
}) {
  const { q, stage } = await searchParams;
  return <OrderTrackingView requestType="SERVICE" label="SOP" basePath="/finance/sop-tracking" stage={stage} search={q} />;
}
