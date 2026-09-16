import type { ReactNode } from "react";

// Shared "list on the left, detail on the right" shape used by Students,
// Performance, Exam/Subject-Exams, and Ask-permissions. `sticky-pane` keeps
// the detail panel in view while the list scrolls (Performance/Exam/
// Ask-permissions); `navigate` is for screens where selecting a row goes to
// its own route instead (Students list -> Students detail).
export function MasterDetailLayout({
  list,
  detail,
  mode,
}: {
  list: ReactNode;
  detail: ReactNode | null;
  mode: "sticky-pane" | "navigate";
}) {
  if (mode === "navigate") {
    return <div>{list}</div>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px] lg:items-start">
      <div>{list}</div>
      {detail && <div className="lg:sticky lg:top-4">{detail}</div>}
    </div>
  );
}
