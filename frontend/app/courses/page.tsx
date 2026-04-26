'use client';
import { useState, useEffect } from 'react';
import {
  getCourses, createCourse, updateCourse, deleteCourse,
  getSubjects, getClasses, getTeachers,
} from '@/lib/api';
import type { Course, Subject, ClassGroup, Teacher } from '@/lib/api';

interface FormState {
  subject_id: string;
  class_group_id: string;
  teacher_id: string;
  weekly_hours: string;
}

const EMPTY_FORM: FormState = {
  subject_id: '',
  class_group_id: '',
  teacher_id: '',
  weekly_hours: '1',
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [cs, subs, cls, tchs] = await Promise.all([
        getCourses(), getSubjects(), getClasses(), getTeachers(),
      ]);
      setCourses(cs);
      setSubjects(subs);
      setClasses(cls);
      setTeachers(tchs);
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
    setForm({
      ...EMPTY_FORM,
      subject_id: subjects[0]?.id ?? '',
      class_group_id: classes[0]?.id ?? '',
      teacher_id: teachers[0]?.id ?? '',
    });
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(c: Course) {
    setEditing(c);
    setForm({
      subject_id: c.subject.id,
      class_group_id: c.class_group.id,
      teacher_id: c.teacher.id,
      weekly_hours: String(c.weekly_hours),
    });
    setFormError(null);
    setModalOpen(true);
  }

  function validate(): string | null {
    if (!form.subject_id) return 'Please select a subject';
    if (!form.class_group_id) return 'Please select a class';
    if (!form.teacher_id) return 'Please select a teacher';
    const wh = parseInt(form.weekly_hours, 10);
    if (isNaN(wh) || wh < 1) return 'Weekly hours must be at least 1';
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { setFormError(err); return; }
    setSaving(true);
    setFormError(null);
    const payload = {
      subject_id: form.subject_id,
      class_group_id: form.class_group_id,
      teacher_id: form.teacher_id,
      weekly_hours: parseInt(form.weekly_hours, 10),
    };
    try {
      if (editing) {
        const updated = await updateCourse(editing.id, payload);
        setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const created = await createCourse(payload);
        setCourses(prev => [...prev, created]);
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
      await deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      setPageError(e.detail ?? 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  }

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const selectClass = "w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hrs/Week</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="text-2xl mb-2">📖</div>
                    <p className="text-slate-400 text-sm">No courses yet.</p>
                    <p className="text-slate-300 text-xs mt-1">Click &ldquo;Add New&rdquo; to create one.</p>
                  </td>
                </tr>
              ) : (
                courses.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{c.subject.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.class_group.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.teacher.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{c.weekly_hours}h</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        {deletingId === c.id ? 'Deleting...' : 'Delete'}
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-5">
              {editing ? 'Edit Course' : 'New Course'}
            </h2>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Subject</label>
                <select {...field('subject_id')} className={selectClass}>
                  <option value="">— Select subject —</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Class</label>
                <select {...field('class_group_id')} className={selectClass}>
                  <option value="">— Select class —</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Grade {c.grade_level})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Teacher</label>
                <select {...field('teacher_id')} className={selectClass}>
                  <option value="">— Select teacher —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.available_slots.length} slots)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Weekly Hours</label>
                <input
                  type="number"
                  min={1}
                  {...field('weekly_hours')}
                  className={selectClass}
                />
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
