import Link from "next/link";

// One consistent tab bar across all four Admin -> Finance views. Overview and
// Payments are their own routes (real pagination); Fee Heads/Fee Structures
// stay the existing client-tab-switched pair living at the bare /admin/finance
// route (unchanged) -- this just adds a way to get to/from them consistently.
function tabsFor(basePath: string): { href: string; label: string }[] {
  return [
    { href: `${basePath}/overview`, label: "Overview" },
    { href: `${basePath}/payments`, label: "Payments" },
    { href: basePath, label: "Fee Heads & Structures" },
  ];
}

export function FinanceTabBar({
  active,
  basePath,
}: {
  active: "Overview" | "Payments" | "Fee Heads & Structures";
  // Additive, defaults to Admin's own route so its existing usage is
  // unaffected -- Principal's oversight view passes its own base path.
  basePath?: string;
}) {
  const TABS = tabsFor(basePath ?? "/admin/finance");
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
