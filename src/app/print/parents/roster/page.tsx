import { PrintReportHeader, PrintReportStyles } from "@/components/dashboard/PrintReport";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fetchAllPages } from "@/lib/fetch-all-pages";

interface ParentRow {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  mobile: string | null;
  status: string;
  childrenCount: number;
  occupation: string | null;
}

export default async function ParentsRosterPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const filterParts: string[] = [];
  for (const key of ["search", "status"] as const) {
    if (params[key]) {
      query.set(key, params[key]!);
      filterParts.push(`${key}=${params[key]}`);
    }
  }

  const { rows, total, truncated } = await fetchAllPages<ParentRow>("/parents", query);

  return (
    <div className="p-8">
      <PrintReportStyles />
      <PrintReportHeader
        title="Parents Report"
        subtitle={`${rows.length}${truncated ? ` of ${total}` : ""} parent accounts`}
        filterSummary={filterParts.length > 0 ? filterParts.join(", ") : undefined}
      />
      <table className="report-table w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b-2 border-border text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Occupation</th>
            <th className="py-2 pr-3">Mobile</th>
            <th className="py-2 pr-3">Email</th>
            <th className="py-2 pr-3">Children Linked</th>
            <th className="py-2 pr-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <td className="py-2 pr-3">{r.firstName} {r.lastName ?? ""}</td>
              <td className="py-2 pr-3">{r.occupation ?? "—"}</td>
              <td className="py-2 pr-3">{r.mobile ?? "—"}</td>
              <td className="py-2 pr-3">{r.email ?? "—"}</td>
              <td className="py-2 pr-3">{r.childrenCount}</td>
              <td className="py-2 pr-3"><StatusPill tone={r.status === "ACTIVE" ? "success" : "critical"} label={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
