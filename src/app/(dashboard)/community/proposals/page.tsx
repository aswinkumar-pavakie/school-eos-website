// Community -> Proposals (Phase 5). A Community user creates and tracks
// proposals/requests for their own community only -- enforced server-side
// (GET /community-proposals resolves "their" community from role_assignment,
// never trusts a client-supplied id). Reviewed by Principal via the existing
// generic approvals engine, not a new decision endpoint here.

import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { CreateProposalForm } from "@/components/community/CreateProposalForm";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface ProposalRow {
  id: string;
  communityName: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "critical";
  return "pending";
}

export default async function CommunityProposalsPage() {
  const res = await apiFetch("/community-proposals");

  if (!res.ok) {
    return (
      <div>
        <h1 className="text-[28px] font-bold leading-[34px] text-text">Proposals</h1>
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-8 text-center">
          <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load proposals</p>
          <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { data: proposals } = (await res.json()) as { data: ProposalRow[] };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Proposals</h1>
          <p className="mt-1 text-sm text-text-muted">
            {proposals.length > 0 ? `For ${proposals[0].communityName}` : "Your community's proposals and requests"}
          </p>
        </div>
        <CreateProposalForm />
      </div>

      {proposals.length === 0 ? (
        <div className="mt-6 flex min-h-[220px] flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="text-[15px] font-extrabold leading-[20px] text-text">No proposals yet</p>
          <p className="mt-1.5 max-w-sm text-sm leading-[19px] text-text-muted">
            Submit a proposal for an activity or initiative and track its status here.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {proposals.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-semibold text-text">{p.title}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statusTone(p.status)} label={p.status.replace(/_/g, " ")} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/community/proposals/${p.id}`} className="text-[13px] font-semibold text-primary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
