# Tasks: School Timetabling System

Use this file as your implementation checklist. Each task maps to a spec requirement or user story. Check off as you go.

---

## Phase 1 — Backend Foundation

### Project Setup
- [ ] Initialise `backend/` with `pyproject.toml` (FastAPI, SQLAlchemy, Alembic, OR-Tools, pytest, ruff, mypy)
- [ ] Configure `app/main.py` with FastAPI app, CORS middleware, and router registration
- [ ] Configure `app/db.py` with SQLite engine and `SessionLocal`
- [ ] Initialise Alembic (`alembic init alembic`)

### Models (FR-001 – FR-008)
- [ ] `app/models/teacher.py` — Teacher + teacher_availability join table
- [ ] `app/models/class_group.py` — ClassGroup
- [ ] `app/models/subject.py` — Subject
- [ ] `app/models/course.py` — Course with unique constraint on (subject_id, class_group_id)
- [ ] `app/models/time_slot.py` — TimeSlot with DayOfWeek enum
- [ ] `app/models/schedule.py` — Schedule + ScheduleEntry

### Migrations & Seed
- [ ] Generate initial Alembic migration (`alembic revision --autogenerate`)
- [ ] Run migration (`alembic upgrade head`)
- [ ] `app/seed.py` — create 40 TimeSlot records (5 × 8, deterministic UUIDs via uuid5)

### Schemas (Pydantic)
- [ ] `app/schemas/teacher.py` — TeacherCreate, TeacherRead
- [ ] `app/schemas/class_group.py` — ClassGroupCreate, ClassGroupRead
- [ ] `app/schemas/subject.py` — SubjectCreate, SubjectRead
- [ ] `app/schemas/course.py` — CourseCreate, CourseRead
- [ ] `app/schemas/time_slot.py` — TimeSlotRead
- [ ] `app/schemas/schedule.py` — ScheduleRead, ScheduleEntryRead, ConflictReport, ConflictDetail

### Repositories
- [ ] `app/repositories/teacher_repo.py`
- [ ] `app/repositories/class_group_repo.py`
- [ ] `app/repositories/subject_repo.py`
- [ ] `app/repositories/course_repo.py`
- [ ] `app/repositories/time_slot_repo.py`
- [ ] `app/repositories/schedule_repo.py`

### Services & Validation
- [ ] `app/services/crud_service.py` — generic CRUD helpers
- [ ] Course creation validates FR-006 (`weekly_hours > teacher available slots` → reject)
- [ ] Course creation validates FR-007 (duplicate subject+class → reject)

### CRUD API Routers
- [ ] `app/api/teachers.py` — GET, POST, GET/{id}, PUT/{id}, DELETE/{id}
- [ ] `app/api/class_groups.py` — full CRUD
- [ ] `app/api/subjects.py` — full CRUD
- [ ] `app/api/courses.py` — full CRUD
- [ ] `app/api/time_slots.py` — GET only

### Tests (Phase 1)
- [ ] `tests/test_teachers.py` — CRUD happy path + validation errors
- [ ] `tests/test_courses.py` — FR-006 and FR-007 validation

---

## Phase 2 — Scheduling Engine

### Interfaces
- [ ] `app/scheduling/interfaces.py` — `IScheduler` ABC with `solve(input) -> ScheduleResult`

### Feasibility Checker (FR-014)
- [ ] `app/scheduling/feasibility_checker.py`
  - [ ] `checkClassCapacity()` — total weekly hours of a class > 40 → CLASS_OVERCOMMIT
  - [ ] `checkTeacherCapacity()` — teacher total hours > available slots → TEACHER_OVERCOMMIT
  - [ ] `checkTeacherAvailability()` — teacher has no usable slots for a given course → TEACHER_AVAILABILITY_INSUFFICIENT

### OR-Tools Scheduler (FR-009 – FR-013)
- [ ] `app/scheduling/ortools_scheduler.py`
  - [ ] `buildModel()` — create `x[course_id, slot_id]` boolean vars
  - [ ] `addCoverageConstraints()` — C4: sum == weekly_hours per course
  - [ ] `addTeacherUniqueness()` — C2: AtMostOne per teacher per slot
  - [ ] `addClassUniqueness()` — C3: AtMostOne per class per slot
  - [ ] `addAvailabilityConstraints()` — C1: force 0 for unavailable slots
  - [ ] Set solver timeout: `parameters.max_time_in_seconds = 10`
  - [ ] `extractSchedule()` — build ScheduleEntry list from solver output

### Conflict Reporter (FR-015)
- [ ] `app/scheduling/conflict_reporter.py` — produce InfeasibilityReason for SOLVER_UNSAT case

### Schedule Service
- [ ] `app/services/schedule_service.py`
  - [ ] `generate()`: load → preCheck → solve → persist → return result
  - [ ] `get_latest()`: return most recent Schedule from DB
  - [ ] `get_by_class(class_id)`: filter entries
  - [ ] `get_by_teacher(teacher_id)`: filter entries

### Schedule API Router (FR-017, FR-018)
- [ ] `app/api/schedule.py`
  - [ ] `POST /schedule/generate` — returns 200 + ScheduleRead or 422 + ConflictReport
  - [ ] `GET /schedule/latest` — returns 200 or 404
  - [ ] `GET /schedule/by-class/{class_id}`
  - [ ] `GET /schedule/by-teacher/{teacher_id}`

### Tests (Phase 2)
- [ ] `tests/test_feasibility_checker.py`
  - [ ] CLASS_OVERCOMMIT detected correctly
  - [ ] TEACHER_OVERCOMMIT detected correctly
  - [ ] TEACHER_AVAILABILITY_INSUFFICIENT detected correctly
- [ ] `tests/test_ortools_scheduler.py`
  - [ ] Trivial case: 1 teacher, 1 class, 1 course (2h) → SUCCESS
  - [ ] Teacher conflict: total assigned > available → INFEASIBLE
  - [ ] Class overcommit: total hours > 40 → caught by pre-check
  - [ ] Multi-entity: 3 teachers, 2 classes, 5 courses → SUCCESS, zero violations
  - [ ] Timeout: solver given unsolvable model → timeout error returned
- [ ] `tests/test_schedule_api.py`
  - [ ] Happy path: valid data → 200 + entries
  - [ ] Infeasible: overcommitted class → 422 + ConflictReport with human_message

---

## Phase 3 — Frontend

### Setup
- [ ] Initialise Next.js 14 (App Router) + TypeScript + Tailwind
- [ ] `lib/api.ts` — typed fetch wrapper for all endpoints
- [ ] `app/layout.tsx` — nav bar with links to all sections
- [ ] `.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:8000/api`

### CRUD Pages
- [ ] `app/teachers/page.tsx` — list + Add/Edit modal
  - [ ] 5×8 availability grid — click to toggle slot
- [ ] `app/classes/page.tsx` — list + Add/Edit modal
- [ ] `app/subjects/page.tsx` — list + Add/Edit modal
- [ ] `app/courses/page.tsx` — list + Add/Edit modal with subject/class/teacher dropdowns

### Schedule Pages & Components
- [ ] `components/ScheduleGrid.tsx` — 5×8 grid, accepts entries + viewMode (class | teacher)
- [ ] `app/schedule/page.tsx`
  - [ ] "Generate Schedule" button with loading state
  - [ ] Class/Teacher selector dropdown
  - [ ] ScheduleGrid rendered with filtered data
  - [ ] Empty state (no schedule yet)
- [ ] `components/ConflictReport.tsx`
  - [ ] human_message prominent display
  - [ ] Per-conflict list with entity, description, suggestion
  - [ ] "Try Again" button

### UX Polish
- [ ] Loading spinners on all async operations
- [ ] Error boundary for API failures
- [ ] Success toast on entity creation
- [ ] Responsive layout (at minimum works at 1280px width)

---

## Phase 4 — Deploy & Documentation

### Backend Deploy
- [ ] `backend/Dockerfile` (python:3.11-slim base, OR-Tools install)
- [ ] Render: create Web Service → Docker → connect repo
- [ ] Render: attach persistent disk at `/data`; set `DATABASE_URL=sqlite:////data/app.db`
- [ ] Render: set `CORS_ORIGINS=https://<vercel-url>`
- [ ] Verify: `POST /schedule/generate` works on production URL

### Frontend Deploy
- [ ] Vercel: import repo → Next.js auto-detected
- [ ] Vercel: set `NEXT_PUBLIC_API_URL=https://<render-url>/api`
- [ ] Verify: full end-to-end flow works in production

### Documentation
- [ ] `README.md` — project description, setup instructions, tech stack, usage
- [ ] Append `specs/001-school-scheduler/spec.md` decisions section to README
- [ ] Take at least 2 screenshots (schedule grid + conflict report) and embed in README
- [ ] Commit all spec files to the repo
