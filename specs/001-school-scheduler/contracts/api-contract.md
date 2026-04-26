# API Contract: School Timetabling System

Version: 1.0
Base URL: `http://localhost:8000/api` (dev) | `https://<render-url>/api` (prod)
Content-Type: `application/json`

---

## Teachers

### GET /teachers
Returns all teachers.

**Response 200**
```json
[
  {
    "id": "uuid",
    "name": "Jane Smith",
    "available_slots": [
      { "id": "uuid", "day": "MONDAY", "period": 1 }
    ]
  }
]
```

### POST /teachers
Create a teacher.

**Request**
```json
{ "name": "Jane Smith", "available_slot_ids": ["uuid", "uuid"] }
```

**Response 201** — TeacherRead

**Response 422** — Validation error (empty name, no slots, etc.)

### PUT /teachers/{id}
Update a teacher. Same request body as POST.

**Response 200** — TeacherRead
**Response 404** — Teacher not found

### DELETE /teachers/{id}
**Response 204**
**Response 409** — Teacher is assigned to one or more courses

---

## Class Groups

### GET /classes → 200 ClassGroupRead[]
### POST /classes → 201 ClassGroupRead
```json
{ "name": "9-A", "grade_level": 9 }
```
### PUT /classes/{id} → 200 ClassGroupRead
### DELETE /classes/{id} → 204 | 409 (assigned to course)

---

## Subjects

### GET /subjects → 200 SubjectRead[]
### POST /subjects → 201 SubjectRead
```json
{ "name": "Mathematics" }
```
**Response 409** — Subject name already exists

### PUT /subjects/{id} → 200 SubjectRead
### DELETE /subjects/{id} → 204 | 409 (assigned to course)

---

## Courses

### GET /courses → 200 CourseRead[]
```json
[
  {
    "id": "uuid",
    "subject": { "id": "uuid", "name": "Mathematics" },
    "class_group": { "id": "uuid", "name": "9-A", "grade_level": 9 },
    "teacher": { "id": "uuid", "name": "Jane Smith", "available_slots": [] },
    "weekly_hours": 4
  }
]
```

### POST /courses → 201 CourseRead
```json
{
  "subject_id": "uuid",
  "class_group_id": "uuid",
  "teacher_id": "uuid",
  "weekly_hours": 4
}
```

**Response 422** — `weekly_hours > teacher.available_slots count`
```json
{ "detail": "Teacher Jane Smith has 20 available slots but this course requires 25 weekly hours." }
```

**Response 409** — Duplicate `(subject_id, class_group_id)`
```json
{ "detail": "Class 9-A already has a course for Mathematics." }
```

### DELETE /courses/{id} → 204

---

## Time Slots

### GET /timeslots → 200 TimeSlotRead[]
```json
[
  { "id": "uuid", "day": "MONDAY", "period": 1 },
  { "id": "uuid", "day": "MONDAY", "period": 2 }
]
```

*(Read-only. Seeded on startup. 40 records.)*

---

## Schedule

### POST /schedule/generate

Triggers schedule generation using current database state. No request body.

**Response 200 — Success**
```json
{
  "id": "uuid",
  "generated_at": "2026-04-26T10:00:00Z",
  "status": "SUCCESS",
  "entries": [
    {
      "course": {
        "id": "uuid",
        "subject": { "id": "uuid", "name": "Mathematics" },
        "class_group": { "id": "uuid", "name": "9-A", "grade_level": 9 },
        "teacher": { "id": "uuid", "name": "Jane Smith", "available_slots": [] },
        "weekly_hours": 4
      },
      "time_slot": { "id": "uuid", "day": "MONDAY", "period": 1 }
    }
  ]
}
```

**Response 422 — Infeasible**
```json
{
  "status": "FAILED",
  "reason": {
    "type": "CLASS_OVERCOMMIT",
    "human_message": "Class 9-A requires 42 weekly hours, but the week only has 40 available time slots.",
    "conflicts": [
      {
        "entity": "ClassGroup:9-A",
        "description": "Total weekly hours (42) exceeds available slots (40).",
        "suggestion": "Reduce the weekly hours of one course in class 9-A, or remove a course."
      }
    ]
  }
}
```

**InfeasibilityType values:**

| Value | Trigger |
|-------|---------|
| `CLASS_OVERCOMMIT` | A class's total weekly hours > 40 |
| `TEACHER_OVERCOMMIT` | A teacher's total assigned hours > available slots |
| `TEACHER_AVAILABILITY_INSUFFICIENT` | Teacher has no usable slots for a course |
| `SOLVER_UNSAT` | Pre-check passed but CP-SAT found no solution |
| `SOLVER_TIMEOUT` | Solver exceeded 10-second limit |

---

### GET /schedule/latest

**Response 200** — ScheduleRead (same shape as POST success response)
**Response 404** — No schedule has been generated yet

---

### GET /schedule/by-class/{class_id}

Returns entries for the given class only.

**Response 200**
```json
[
  {
    "course": { "...": "CourseRead" },
    "time_slot": { "id": "uuid", "day": "TUESDAY", "period": 3 }
  }
]
```
**Response 404** — Class not found or no schedule exists

---

### GET /schedule/by-teacher/{teacher_id}

Same structure as `by-class`. Returns entries for the given teacher only.

---

## Error Format (general)

All error responses follow:
```json
{ "detail": "Human-readable error message" }
```

FastAPI Pydantic validation errors (field-level) follow the standard FastAPI 422 format with a `loc` array.

---

## TypeScript Client Types

```typescript
// lib/api.ts

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
```
