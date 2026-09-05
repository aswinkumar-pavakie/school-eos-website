import { OrderTrackingView } from "../_shared/OrderTrackingView";

export default async function PopTrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>;
}) {
  const { q, stage } = await searchParams;
  return <OrderTrackingView requestType="GOODS" label="POP" basePath="/finance/pop-tracking" stage={stage} search={q} />;
}
