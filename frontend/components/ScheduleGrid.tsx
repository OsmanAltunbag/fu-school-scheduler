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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-600 w-20">
              Period
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600"
              >
                {DAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((period) => (
            <tr key={period}>
              <td className="border border-gray-300 px-3 py-2 font-medium text-gray-500 bg-gray-50">
                Period {period}
              </td>
              {DAYS.map((day) => {
                const entry = cellMap[day]?.[period];
                if (!entry) {
                  return (
                    <td
                      key={day}
                      className="border border-gray-300 px-3 py-2 bg-gray-100"
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
                    className="border border-gray-300 px-3 py-2 bg-white"
                  >
                    <span className="font-medium">{line1}</span>
                    <span className="text-gray-500"> — {line2}</span>
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
