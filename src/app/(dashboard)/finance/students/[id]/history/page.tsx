import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listStudentPayments } from "@/lib/finance-api";
import { PaymentHistoryTable } from "./PaymentHistoryTable";

export default async function StudentPaymentHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const payments = await listStudentPayments(id);

    if (payments.length === 0) {
      return <EmptyState title="No payments recorded" body="Payments received against this student will appear here." />;
    }

    return <PaymentHistoryTable payments={payments} />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load payment history. Nothing was submitted — try again." />;
  }
}
