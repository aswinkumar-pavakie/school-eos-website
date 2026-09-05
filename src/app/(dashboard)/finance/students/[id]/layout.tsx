import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { formatMoneyDetail, formatPercent } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getStudent } from "@/lib/finance-api";
import type { ReactNode } from "react";

const TABS = [
  { href: "", label: "Receive Payment" },
  { href: "/demand", label: "Demand Details" },
  { href: "/history", label: "Payment History" },
  { href: "/concessions", label: "Fee Concessions" },
  { href: "/education-loan-dd", label: "Education Loan DD" },
];

export default async function StudentWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const student = await getStudent(id);
    const total = BigInt(student.totalDemandPaise);
    const collectionPct = total > BigInt(0) ? (Number(BigInt(student.paidPaise) * BigInt(1000) / total) / 10).toFixed(1) : "0.0";

    return (
      <div className="flex flex-col gap-6">
        <Link href="/finance/fee-payments" className="text-sm font-bold text-text-muted hover:text-text">
          ← Back to Students
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold text-text">{student.displayName}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {student.admissionNo} · {[student.gradeName, student.sectionName].filter(Boolean).join(" ")}
            {student.communityCategory ? ` · ${student.communityCategory}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Total Demand</p>
            <p className="mt-1 font-mono font-bold text-text">{formatMoneyDetail(student.totalDemandPaise)}</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Paid Amount</p>
            <p className="mt-1 font-mono font-bold text-text">{formatMoneyDetail(student.paidPaise)}</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Outstanding</p>
            <p className="mt-1 font-mono font-bold text-text">{formatMoneyDetail(student.outstandingPaise)}</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Collection %</p>
            <p className="mt-1 font-mono font-bold text-text">{formatPercent(collectionPct, 1)}</p>
          </div>
        </div>

        <nav className="flex gap-1 border-b border-border">
          {TABS.map((tab) => (
            <Link
              key={tab.label}
              href={`/finance/students/${id}${tab.href}`}
              className="border-b-2 border-transparent px-3 py-2.5 text-sm font-bold text-text-muted hover:text-text"
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this student. Nothing was submitted — try again." />;
  }
}
