// Issue books -- pixel-rebuilt from the design's own Issue books screen. The
// design's borrower role tabs are Student/Teacher/Parent; the real schema's
// LibraryMember.memberType is only STUDENT/STAFF (no Parent member type
// exists at all -- confirmed via create-member.dto.ts's own @IsIn), so
// "Teacher" and "Parent" collapse into the one real "Staff" tab rather than
// offering a tab that could never return a real hit.
//
// The old combined Issue+Returns table page now lives at /library/returns
// ("Returns & renewals" in the design's own nav) -- this route is issuing
// only, matching the design's own screen split.

import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { getLibraryConfig } from "@/lib/library-api";
import { nowMs, todayIsoDate } from "@/lib/library-time";
import { IssueBooksClient } from "./IssueBooksClient";

export default async function LibraryIssueBooksPage() {
  try {
    const config = await getLibraryConfig();
    const due = new Date(nowMs());
    due.setDate(due.getDate() + config.loanPeriodDays);
    const defaultDueDate = todayIsoDate(due.getTime());

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>Issue books</h1>
          <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
            Look up a member, pick an available copy and set the due date.
          </div>
        </div>
        <IssueBooksClient defaultDueDate={defaultDueDate} finePerDayPaise={config.finePerDayPaise} />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load Issue books</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
