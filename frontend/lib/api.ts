const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw { status: res.status, detail: body.detail ?? body };
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface TimeSlot {
  id: string;
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
  period: number;
}

export interface Teacher {
  id: string;
  name: string;
  available_slots: TimeSlot[];
}

export interface ClassGroup {
  id: string;
  name: string;
  grade_level: number;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  subject: Subject;
  class_group: ClassGroup;
  teacher: Teacher;
  weekly_hours: number;
}

export interface ScheduleEntry {
  course: Course;
  time_slot: TimeSlot;
}

export interface Schedule {
  id: string;
  generated_at: string;
  status: 'SUCCESS' | 'FAILED';
  entries: ScheduleEntry[];
}

export interface ConflictDetail {
  entity: string;
  description: string;
  suggestion?: string;
}

export interface ConflictReport {
  type: string;
  human_message: string;
  conflicts: ConflictDetail[];
}

// ── Time Slots ───────────────────────────────────────────────────────────────

export const getTimeslots = () => request<TimeSlot[]>('/timeslots');

// ── Teachers ─────────────────────────────────────────────────────────────────

export const getTeachers = () => request<Teacher[]>('/teachers');

export const createTeacher = (data: { name: string; available_slot_ids: string[] }) =>
  request<Teacher>('/teachers', { method: 'POST', body: JSON.stringify(data) });

export const updateTeacher = (id: string, data: { name: string; available_slot_ids: string[] }) =>
  request<Teacher>(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteTeacher = (id: string) =>
  request<void>(`/teachers/${id}`, { method: 'DELETE' });

// ── Class Groups ─────────────────────────────────────────────────────────────

export const getClasses = () => request<ClassGroup[]>('/classes');

export const createClass = (data: { name: string; grade_level: number }) =>
  request<ClassGroup>('/classes', { method: 'POST', body: JSON.stringify(data) });

export const updateClass = (id: string, data: { name: string; grade_level: number }) =>
  request<ClassGroup>(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteClass = (id: string) =>
  request<void>(`/classes/${id}`, { method: 'DELETE' });

// ── Subjects ─────────────────────────────────────────────────────────────────

export const getSubjects = () => request<Subject[]>('/subjects');

export const createSubject = (data: { name: string }) =>
  request<Subject>('/subjects', { method: 'POST', body: JSON.stringify(data) });

export const updateSubject = (id: string, data: { name: string }) =>
  request<Subject>(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteSubject = (id: string) =>
  request<void>(`/subjects/${id}`, { method: 'DELETE' });

// ── Courses ──────────────────────────────────────────────────────────────────

export const getCourses = () => request<Course[]>('/courses');

export const createCourse = (data: {
  subject_id: string;
  class_group_id: string;
  teacher_id: string;
  weekly_hours: number;
}) => request<Course>('/courses', { method: 'POST', body: JSON.stringify(data) });

export const updateCourse = (
  id: string,
  data: { subject_id: string; class_group_id: string; teacher_id: string; weekly_hours: number },
) => request<Course>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCourse = (id: string) =>
  request<void>(`/courses/${id}`, { method: 'DELETE' });

// ── Schedule ─────────────────────────────────────────────────────────────────

export const generateSchedule = () =>
  request<Schedule>('/schedule/generate', { method: 'POST' });

export const getLatestSchedule = () => request<Schedule>('/schedule/latest');

export const getScheduleByClass = (id: string) =>
  request<ScheduleEntry[]>(`/schedule/by-class/${id}`);

export const getScheduleByTeacher = (id: string) =>
  request<ScheduleEntry[]>(`/schedule/by-teacher/${id}`);
