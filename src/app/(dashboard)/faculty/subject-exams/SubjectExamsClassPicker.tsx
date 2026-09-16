"use client";

import { useRouter } from "next/navigation";
import { CustomSelect, iconCardTrigger } from "@/components/faculty-ui/CustomSelect";

export function SubjectExamsClassPicker({
  offerings,
  subjectOfferingId,
}: {
  offerings: { subjectOfferingId: string; subjectName: string; gradeName: string; sectionName: string }[];
  subjectOfferingId?: string;
}) {
  const router = useRouter();
  return (
    <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "16px 20px", maxWidth: 380 }}>
      <CustomSelect
        value={subjectOfferingId ?? ""}
        options={offerings.map((o) => ({ value: o.subjectOfferingId, label: `${o.subjectName} · ${o.gradeName}-${o.sectionName}` }))}
        onChange={(v) => router.push(`/faculty/subject-exams?subjectOfferingId=${v}`)}
        trigger={iconCardTrigger("SUBJECT · CLASS")}
      />
    </div>
  );
}
