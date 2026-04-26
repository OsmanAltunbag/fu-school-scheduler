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
        <h1 className="text-2xl font-bold">Teachers</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          Add New
        </button>
      </div>

      {pageError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">
          {pageError}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 py-8 text-center">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Available Slots</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-400 py-12">
                    No teachers yet. Click &ldquo;Add New&rdquo; to create one.
                  </td>
                </tr>
              ) : (
                teachers.map(t => (
                  <tr key={t.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{t.name}</td>
                    <td className="px-4 py-3 text-sm">{t.available_slots.length} / 40</td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={() => openEdit(t)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="text-sm text-red-600 hover:underline disabled:opacity-40"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Edit Teacher' : 'New Teacher'}
            </h2>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Jane Smith"
                autoFocus
              />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Availability ({selectedSlotIds.size} slots selected)
                </label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSlotIds(new Set(timeslots.map(s => s.id)))}
                    className="text-blue-600 hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSlotIds(new Set())}
                    className="text-gray-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="w-16 px-2 py-1 text-gray-500 font-medium text-left">Period</th>
                      {DAYS.map(d => (
                        <th key={d} className="w-16 px-2 py-1 text-center text-gray-600 font-medium">
                          {DAY_LABELS[d]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map(period => (
                      <tr key={period}>
                        <td className="px-2 py-1 text-gray-500 font-medium">{period}</td>
                        {DAYS.map(day => {
                          const slot = slotMap[day]?.[period];
                          const selected = slot ? selectedSlotIds.has(slot.id) : false;
                          return (
                            <td key={day} className="px-1 py-1">
                              <button
                                type="button"
                                disabled={!slot}
                                onClick={() => slot && toggleSlot(slot.id)}
                                className={`w-14 h-8 rounded text-xs font-medium transition-colors ${
                                  selected
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                } disabled:opacity-30`}
                              >
                                {selected ? '✓' : ''}
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
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
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
