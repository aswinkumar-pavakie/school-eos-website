import Link from "next/link";

// One consistent tab bar across all four Admin -> Finance views. Overview and
// Payments are their own routes (real pagination); Fee Heads/Fee Structures
// stay the existing client-tab-switched pair living at the bare /admin/finance
// route (unchanged) -- this just adds a way to get to/from them consistently.
const TABS: { href: string; label: string }[] = [
  { href: "/admin/finance/overview", label: "Overview" },
  { href: "/admin/finance/payments", label: "Payments" },
  { href: "/admin/finance", label: "Fee Heads & Structures" },
];

export function FinanceTabBar({ active }: { active: "Overview" | "Payments" | "Fee Heads & Structures" }) {
  return (
    <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border">
      {TABS.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          className={`whitespace-nowrap border-b-2 px-1 pb-2 text-[13px] font-semibold ${
            active === tab.label ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
