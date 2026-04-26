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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
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
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Class</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Teacher</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Hours/Week</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-12">
                    No courses yet. Click &ldquo;Add New&rdquo; to create one.
                  </td>
                </tr>
              ) : (
                courses.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{c.subject.name}</td>
                    <td className="px-4 py-3 text-sm">{c.class_group.name}</td>
                    <td className="px-4 py-3 text-sm">{c.teacher.name}</td>
                    <td className="px-4 py-3 text-sm">{c.weekly_hours}</td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="text-sm text-red-600 hover:underline disabled:opacity-40"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Edit Course' : 'New Course'}
            </h2>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  {...field('subject_id')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Select subject —</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  {...field('class_group_id')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Select class —</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Grade {c.grade_level})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select
                  {...field('teacher_id')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Select teacher —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.available_slots.length} slots)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Hours</label>
                <input
                  type="number"
                  min={1}
                  {...field('weekly_hours')}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
