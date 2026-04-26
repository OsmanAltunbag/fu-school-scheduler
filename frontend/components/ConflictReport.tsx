import type { ConflictReport as ConflictReportType, ConflictDetail } from '@/lib/api';

interface Props {
  report: ConflictReportType;
  onRetry: () => void;
}

export default function ConflictReport({ report, onRetry }: Props) {
  return (
    <div className="border border-red-300 bg-red-50 rounded-lg p-5">
      <p className="text-red-700 font-semibold text-base mb-4">{report.human_message}</p>

      {report.conflicts.length > 0 && (
        <ul className="space-y-3 mb-5">
          {report.conflicts.map((conflict: ConflictDetail, i: number) => (
            <li key={i} className="bg-white border border-red-200 rounded px-4 py-3">
              <p className="text-sm font-bold text-gray-800">{conflict.entity}</p>
              <p className="text-sm text-gray-700 mt-0.5">{conflict.description}</p>
              {conflict.suggestion && (
                <p className="text-sm text-gray-500 italic mt-1">{conflict.suggestion}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onRetry}
        className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}
