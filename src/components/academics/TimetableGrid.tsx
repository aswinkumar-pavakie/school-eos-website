// Shared weekly-grid renderer -- used by both the Timetable page (per section) and
// the Faculty profile's own Timetable section (per teacher, spans sections).

const DAY_LABELS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  room: string | null;
  periodNo: number;
  periodLabel: string;
  startTime: string;
  endTime: string;
  sectionName: string;
  gradeName: string;
  subjectName: string;
  teacherFirstName: string;
  teacherLastName: string | null;
}

export function TimetableGrid({ slots, showSection = false }: { slots: TimetableSlot[]; showSection?: boolean }) {
  if (slots.length === 0) {
    return <p className="text-sm text-text-muted">No timetable slots on file yet.</p>;
  }

  const periods = [...new Map(slots.map((s) => [s.periodNo, s])).values()].sort((a, b) => a.periodNo - b.periodNo);
  const days = [...new Set(slots.map((s) => s.dayOfWeek))].sort((a, b) => a - b);
  const byCell = new Map<string, TimetableSlot>();
  for (const s of slots) byCell.set(`${s.dayOfWeek}-${s.periodNo}`, s);

  return (
    <div className="overflow-x-auto rounded-[16px] border border-border">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
            <th className="whitespace-nowrap bg-field px-3 py-2.5">Period</th>
            {days.map((d) => (
              <th key={d} className="whitespace-nowrap bg-field px-3 py-2.5">
                {DAY_LABELS[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {periods.map((period) => (
            <tr key={period.periodNo}>
              <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-text-muted">
                {period.periodLabel}
                <div className="font-normal">
                  {period.startTime.slice(0, 5)}–{period.endTime.slice(0, 5)}
                </div>
              </td>
              {days.map((d) => {
                const slot = byCell.get(`${d}-${period.periodNo}`);
                return (
                  <td key={d} className="px-3 py-2.5 align-top">
                    {slot ? (
                      <div>
                        <p className="text-[13px] font-semibold text-text">{slot.subjectName}</p>
                        <p className="text-xs text-text-muted">
                          {showSection ? `${slot.gradeName} · ${slot.sectionName} · ` : ""}
                          {slot.teacherFirstName} {slot.teacherLastName ?? ""}
                          {slot.room ? ` · ${slot.room}` : ""}
                        </p>
                      </div>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
