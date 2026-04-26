'use client';
import { useState, useEffect, useCallback } from 'react';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher, getTimeslots } from '@/lib/api';
import type { Teacher, TimeSlot } from '@/lib/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri',
};
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

type SlotMap = Record<string, Record<number, TimeSlot>>;

function buildSlotMap(slots: TimeSlot[]): SlotMap {
  const map: SlotMap = {};
  for (const slot of slots) {
    if (!map[slot.day]) map[slot.day] = {};
    map[slot.day][slot.period] = slot;
  }
  return map;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [slotMap, setSlotMap] = useState<SlotMap>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [name, setName] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [ts, slots] = await Promise.all([getTeachers(), getTimeslots()]);
      setTeachers(ts);
      setTimeslots(slots);
      setSlotMap(buildSlotMap(slots));
      setPageError(null);
    } catch (e: any) {
      setPageError(e.detail ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setName('');
    setSelectedSlotIds(new Set());
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(t: Teacher) {
    setEditing(t);
    setName(t.name);
    setSelectedSlotIds(new Set(t.available_slots.map(s => s.id)));
    setFormError(null);
    setModalOpen(true);
  }

  const toggleSlot = useCallback((slotId: string) => {
    setSelectedSlotIds(prev => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  }, []);

  async function handleSave() {
    if (!name.trim()) { setFormError('Name is required'); return; }
    setSaving(true);
    setFormError(null);
    const payload = { name: name.trim(), available_slot_ids: Array.from(selectedSlotIds) };
    try {
      if (editing) {
        const updated = await updateTeacher(editing.id, payload);
        setTeachers(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        const created = await createTeacher(payload);
        setTeachers(prev => [...prev, created]);
      }
      setModalOpen(false);
    } catch (e: any) {
      setFormError(e.detail ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setPageError(null);
    try {
      await deleteTeacher(id);
      setTeachers(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      setPageError(e.detail ?? 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
        <button
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
        >
          Add New
        </button>
      </div>

      {pageError && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {pageError}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 py-12 text-center text-sm">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Slots</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-16">
                    <div className="text-2xl mb-2">👨‍🏫</div>
                    <p className="text-slate-400 text-sm">No teachers yet.</p>
                    <p className="text-slate-300 text-xs mt-1">Click &ldquo;Add New&rdquo; to create one.</p>
                  </td>
                </tr>
              ) : (
                teachers.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{t.available_slots.length} / 40 slots</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => openEdit(t)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        {deletingId === t.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-5">
              {editing ? 'Edit Teacher' : 'New Teacher'}
            </h2>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g. Jane Smith"
                autoFocus
              />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Availability <span className="text-amber-600 normal-case font-medium">({selectedSlotIds.size} selected)</span>
                </label>
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSlotIds(new Set(timeslots.map(s => s.id)))}
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSlotIds(new Set())}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="border-collapse">
                  <thead>
                    <tr>
                      <th className="w-12 pr-3 py-1 text-slate-400 font-dm-mono text-xs text-left">P</th>
                      {DAYS.map(d => (
                        <th key={d} className="w-10 px-1 py-1 text-center font-dm-mono text-xs text-slate-500 uppercase">
                          {DAY_LABELS[d]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map(period => (
                      <tr key={period}>
                        <td className="pr-3 py-1 font-dm-mono text-xs text-slate-400">{period}</td>
                        {DAYS.map(day => {
                          const slot = slotMap[day]?.[period];
                          const selected = slot ? selectedSlotIds.has(slot.id) : false;
                          return (
                            <td key={day} className="px-1 py-1">
                              <button
                                type="button"
                                disabled={!slot}
                                onClick={() => slot && toggleSlot(slot.id)}
                                className={`w-9 h-9 rounded text-xs font-medium transition-all ${
                                  selected
                                    ? 'bg-slate-900 text-white border border-slate-900 hover:bg-slate-700'
                                    : 'bg-slate-100 text-transparent border border-slate-300 hover:bg-slate-200'
                                } disabled:opacity-30`}
                              >
                                {selected ? '·' : ''}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {formError && (
              <div className="text-red-600 text-sm mb-4">{formError}</div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
