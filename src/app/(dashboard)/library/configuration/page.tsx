// Settings -- pixel-rebuilt from the design's own 3-card screen. Real
// library_config only has 5 fields (loanPeriodDays/maxRenewals/
// finePerDayPaise/maxBooksPerMember/reservationHoldDays) -- the design's
// per-class-band borrowing limits, teacher-specific limit, block-issue
// threshold, lost-book-charge formula, "collected by", barcode format,
// spine label prefix and counter hours have no real column anywhere.
// Same choice as CreateBookModal's own per-copy fields: omitted, not shown
// as fake disabled inputs that would imply a setting exists when it
// doesn't. "Reservation hold days" is real but wasn't in the design at all
// -- added to Borrowing rules as a disclosed, necessary addition.

import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { getLibraryConfig } from "@/lib/library-api";
import { ConfigurationForm } from "./ConfigurationForm";

export default async function LibraryConfigurationPage() {
  try {
    const config = await getLibraryConfig();

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1020 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>Settings</h1>
          <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Borrowing rules, fines and reservation hold period.</div>
        </div>
        <ConfigurationForm config={config} />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load Library configuration</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
