"use client";

import { useRouter } from "next/navigation";
import { CustomSelect, iconCardTrigger } from "@/components/faculty-ui/CustomSelect";

// Own client-component file (not an inline function in the Server Component
// page) -- a Server Component can't pass a plain closure as a prop across
// the boundary, so navigation on change has to live here, using its own
// useRouter, not a server-supplied callback.
export function SubjectClassSelect({
  offerings,
  subjectOfferingId,
}: {
  offerings: { subjectOfferingId: string; subjectName: string; gradeName: string; sectionName: string }[];
  subjectOfferingId?: string;
}) {
  const router = useRouter();
  return (
    <CustomSelect
      value={subjectOfferingId ?? ""}
      options={offerings.map((o) => ({ value: o.subjectOfferingId, label: `${o.subjectName} · ${o.gradeName}-${o.sectionName}` }))}
      onChange={(v) => router.push(`/faculty/marks-entry?subjectOfferingId=${v}`)}
      trigger={iconCardTrigger("SUBJECT · CLASS")}
    />
  );
}
