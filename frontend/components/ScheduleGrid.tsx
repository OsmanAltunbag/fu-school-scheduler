import type { ScheduleEntry } from '@/lib/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
};
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface Props {
  entries: ScheduleEntry[];
  viewMode: 'class' | 'teacher';
}

type CellMap = Record<string, Record<number, ScheduleEntry>>;

function buildCellMap(entries: ScheduleEntry[]): CellMap {
  const map: CellMap = {};
  for (const entry of entries) {
    const { day, period } = entry.time_slot;
    if (!map[day]) map[day] = {};
    map[day][period] = entry;
  }
  return map;
}

export default function ScheduleGrid({ entries, viewMode }: Props) {
  const cellMap = buildCellMap(entries);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 border-r border-slate-200">
              Period
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                {DAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((period) => (
            <tr key={period} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 font-dm-mono text-xs text-slate-400 bg-slate-50 border-r border-slate-200">
                P{period}
              </td>
              {DAYS.map((day) => {
                const entry = cellMap[day]?.[period];
                if (!entry) {
                  return (
                    <td
                      key={day}
                      className="px-3 py-3 bg-[#F8FAFC] border-r border-slate-100 last:border-0"
                    />
                  );
                }
                const line1 = entry.course.subject.name;
                const line2 =
                  viewMode === 'class'
                    ? entry.course.teacher.name
                    : entry.course.class_group.name;
                return (
                  <td
                    key={day}
                    className="px-0 py-0 border-r border-slate-100 last:border-0"
                  >
                    <div className="border-l-[3px] border-amber-500 bg-white px-3 py-2.5 h-full">
                      <p className="font-semibold text-slate-900 text-xs leading-snug">{line1}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{line2}</p>
                    </div>
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
