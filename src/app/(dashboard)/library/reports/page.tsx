import Link from "next/link";

// A landing/index page linking out to each report. Circulation/Overdue/
// Reservation/Lost & Damaged/Fine reports are NOT separate pages here -- they
// link straight to the real operational pages that already show that exact
// data (Circulation, Reservations, Lost & Damaged, Fines), since building a
// second near-identical table would be exactly the "duplicate business logic"
// this module is meant to avoid. Only Inventory, Member Activity, and
// Transaction History are genuinely new views with no existing equivalent.
const REPORTS: { title: string; description: string; href: string }[] = [
  { title: "Book Inventory Report", description: "Full copy-status breakdown across the catalog.", href: "/library/reports/inventory" },
  { title: "Circulation Report", description: "Issues, returns and renewals -- filter by date range on the Circulation page itself.", href: "/library/circulation" },
  { title: "Overdue Report", description: "Every issue currently past its due date.", href: "/library/circulation?overdueOnly=true" },
  { title: "Reservation Report", description: "Active, ready, and historical reservations.", href: "/library/reservations" },
  { title: "Lost & Damaged Report", description: "Every lost/damaged incident and its current resolution.", href: "/library/lost-damaged" },
  { title: "Member Activity Report", description: "Per-member borrowing, overdue, and fine activity.", href: "/library/reports/member-activity" },
  { title: "Library Fine / Liability Report", description: "Library-side fine status -- Finance remains the payment source of truth.", href: "/library/fines" },
  { title: "Transaction History Report", description: "A date-ranged feed of every issue/return/renewal/reservation/lost/damaged event.", href: "/library/reports/transaction-history" },
];

export default function LibraryReportsPage() {
  return (
    <div className="mx-auto max-w-[1000px]">
      <div>
        <h1 className="text-[28px] font-bold leading-[34px] text-text">Reports</h1>
        <p className="mt-1 text-sm text-text-muted">Operational Library reporting, built from real data -- nothing here is a placeholder figure.</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="block rounded-[16px] border border-border bg-surface p-[18px] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">{r.title}</h2>
            <p className="mt-1.5 text-[13px] text-text-muted">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
