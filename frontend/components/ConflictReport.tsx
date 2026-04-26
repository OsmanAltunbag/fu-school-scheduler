import type { ConflictReport as ConflictReportType, ConflictDetail } from '@/lib/api';

interface Props {
  report: ConflictReportType;
  onRetry: () => void;
}

export default function ConflictReport({ report, onRetry }: Props) {
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-xl overflow-hidden">
      <div className="border-l-4 border-amber-500 px-5 py-4">
        <p className="text-slate-800 font-semibold text-sm flex items-center gap-2">
          <span>⚠️</span>
          {report.human_message}
        </p>
      </div>

      {report.conflicts.length > 0 && (
        <ul className="px-5 pb-4 space-y-2">
          {report.conflicts.map((conflict: ConflictDetail, i: number) => (
            <li key={i} className="bg-white border border-amber-100 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{conflict.entity}</p>
              <p className="text-sm text-slate-600 mt-1 flex items-start gap-1.5">
                <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                {conflict.description}
              </p>
              {conflict.suggestion && (
                <p className="text-xs text-slate-400 italic mt-1.5">{conflict.suggestion}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="px-5 pb-4">
        <button
          onClick={onRetry}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
