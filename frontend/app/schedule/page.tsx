'use client';
import { useState, useEffect } from 'react';
import {
  generateSchedule,
  getLatestSchedule,
  getScheduleByClass,
  getScheduleByTeacher,
  getClasses,
  getTeachers,
} from '@/lib/api';
import type { Schedule, ScheduleEntry, ConflictReport, ClassGroup, Teacher } from '@/lib/api';
import ScheduleGrid from '@/components/ScheduleGrid';
import ConflictReportComponent from '@/components/ConflictReport';

type ViewMode = 'class' | 'teacher';

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [conflictReport, setConflictReport] = useState<ConflictReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('class');
  const [selectedId, setSelectedId] = useState<string>('');
  const [filteredEntries, setFilteredEntries] = useState<ScheduleEntry[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const [latestSchedule, cls, tch] = await Promise.allSettled([
          getLatestSchedule(),
          getClasses(),
          getTeachers(),
        ]);

        if (cls.status === 'fulfilled') setClasses(cls.value);
        if (tch.status === 'fulfilled') setTeachers(tch.value);

        if (latestSchedule.status === 'fulfilled') {
          setSchedule(latestSchedule.value);
          setFilteredEntries(latestSchedule.value.entries);
        }
      } finally {
        setInitialLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!schedule) return;
    setSelectedId('');
    setFilteredEntries(schedule.entries);
  }, [viewMode, schedule]);

  async function handleSelectId(id: string) {
    setSelectedId(id);
    if (!id) {
      setFilteredEntries(schedule?.entries ?? []);
      return;
    }
    try {
      const entries =
        viewMode === 'class'
          ? await getScheduleByClass(id)
          : await getScheduleByTeacher(id);
      setFilteredEntries(entries);
    } catch {
      setFilteredEntries([]);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setConflictReport(null);
    try {
      const result = await generateSchedule();
      setSchedule(result);
      setFilteredEntries(result.entries);
      setSelectedId('');
    } catch (err: unknown) {
      const e = err as { status?: number; detail?: unknown };
      if (e.status === 422 && e.detail && typeof e.detail === 'object') {
        const detail = e.detail as { reason?: ConflictReport };
        if (detail.reason) {
          setConflictReport(detail.reason);
          setSchedule(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const dropdownItems = viewMode === 'class' ? classes : teachers;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Weekly Schedule</h1>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {loading ? 'Generating...' : 'Generate Schedule'}
        </button>
      </div>

      {conflictReport && (
        <div className="mb-6">
          <ConflictReportComponent
            report={conflictReport}
            onRetry={handleGenerate}
          />
        </div>
      )}

      {initialLoading ? (
        <div className="text-gray-500 py-8 text-center">Loading...</div>
      ) : !schedule ? (
        !conflictReport && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">No schedule generated yet.</p>
            <p className="text-sm">Click <span className="font-medium text-gray-600">Generate Schedule</span> to start.</p>
          </div>
        )
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex rounded overflow-hidden border border-gray-300">
              <button
                onClick={() => setViewMode('class')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'class'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                By Class
              </button>
              <button
                onClick={() => setViewMode('teacher')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'teacher'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                By Teacher
              </button>
            </div>

            <select
              value={selectedId}
              onChange={(e) => handleSelectId(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All {viewMode === 'class' ? 'Classes' : 'Teachers'}</option>
              {dropdownItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <ScheduleGrid entries={filteredEntries} viewMode={viewMode} />
        </div>
      )}
    </div>
  );
}
