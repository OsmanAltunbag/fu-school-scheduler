# Implementation Plan: School Timetabling System

## Phases

### Phase 1 — Backend Foundation
**Goal:** Running FastAPI app with all entities, CRUD endpoints, and database migrations.
**Deliverable:** All CRUD endpoints return correct data; `/docs` renders correctly; TimeSlots seeded.

Steps:
1. Initialise project (`pyproject.toml`, `uv`/`poetry`, `ruff`, `mypy`)
2. Configure FastAPI app (`main.py`), SQLAlchemy engine (`db.py`), Alembic
3. Write SQLAlchemy models: Teacher, ClassGroup, Subject, Course, TimeSlot, Schedule, ScheduleEntry, teacher_availability
4. Generate and run initial Alembic migration
5. Write Pydantic schemas (Create, Update, Read variants per entity)
6. Implement repository layer (one file per entity, typed return values)
7. Implement service layer with business rule validation (FR-006, FR-007)
8. Implement API routers: `/teachers`, `/classes`, `/subjects`, `/courses`, `/timeslots`
9. Write seed script for 40 TimeSlot records (deterministic UUIDs)
10. Write CRUD unit tests for service layer

**Estimated time:** 3–4 hours

---

### Phase 2 — Scheduling Engine
**Goal:** Working OR-Tools CP-SAT solver with feasibility checking and conflict reporting; `/schedule/generate` endpoint operational.
**Deliverable:** Given valid input, solver returns a schedule with zero violations. Given invalid input, a 422 with a human-readable ConflictReport is returned.

Steps:
1. Define `IScheduler` ABC in `scheduling/interfaces.py`
2. Implement `FeasibilityChecker` with three pre-checks (class capacity, teacher capacity, teacher availability)
3. Implement `ORToolsScheduler`:
   - `buildModel()` — create boolean variables `x[course, slot]`
   - `addCoverageConstraints()` — C4
   - `addTeacherUniqueness()` — C2
   - `addClassUniqueness()` — C3
   - `addAvailabilityConstraints()` — C1
   - `extractSchedule()` — read solver output into ScheduleEntry list
   - Solver timeout: `parameters.max_time_in_seconds = 10`
4. Implement `ConflictReporter` for SOLVER_UNSAT case
5. Implement `ScheduleService` orchestrating: load → preCheck → solve → persist
6. Implement API endpoints: `POST /schedule/generate`, `GET /schedule/latest`, `GET /schedule/by-class/{id}`, `GET /schedule/by-teacher/{id}`
7. Write unit tests for `FeasibilityChecker` (all 3 checks)
8. Write unit tests for `ORToolsScheduler` (5 cases: trivial, teacher conflict, class overcommit, multi-entity, timeout)
9. Write integration test for the full generation flow (happy path + infeasible path)

**Estimated time:** 3–4 hours

---

### Phase 3 — Frontend
**Goal:** Functional UI covering all 4 user stories.
**Deliverable:** Admin can configure entities, generate a schedule, view it by class/teacher, and read conflict reports — all from the browser.

Steps:
1. Initialise Next.js 14 (App Router) + TypeScript + TailwindCSS
2. Write typed API client in `lib/api.ts`
3. Build navigation layout (Teachers | Classes | Subjects | Courses | Schedule)
4. Build CRUD pages:
   - Teachers (list + modal form with 5×8 availability grid)
   - Classes (list + modal form)
   - Subjects (list + modal form)
   - Courses (list + modal form with dropdowns loaded from API)
5. Build `ScheduleGrid` component (5 columns = days, 8 rows = periods; each cell shows subject + teacher or class)
6. Build Schedule page (Generate button, class/teacher dropdown selector, ScheduleGrid)
7. Build `ConflictReport` component (human_message prominently, per-conflict list with suggestions)
8. Add loading states, empty states, and error boundaries
9. Manual end-to-end walkthrough: configure → generate → view

**Estimated time:** 3–4 hours

---

### Phase 4 — Deploy & Documentation
**Goal:** Live application accessible via public URL; README complete.
**Deliverable:** Vercel frontend + Render backend live; README includes setup, usage, and decisions.

Steps:
1. Write `backend/Dockerfile` (python:3.11-slim, install ortools)
2. Deploy backend to Render (Docker, attach persistent disk for SQLite)
3. Set CORS origins to Vercel domain
4. Deploy frontend to Vercel (`NEXT_PUBLIC_API_URL` env var set)
5. Verify end-to-end flow in production
6. Write `README.md` (setup, structure, tech stack, decisions)
7. Finalise `specs/001-school-scheduler/` — all spec files committed

**Estimated time:** 1–2 hours

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OR-Tools binary fails to install on Render | Medium | High | Test Docker build locally first; have Railway as fallback |
| Solver timeout on valid large inputs | Low | Medium | Set `max_time_in_seconds=10`; return timeout-specific error |
| SQLite concurrency on Render | Low | Low | `check_same_thread=False`; single-user assumption |
| Phase 3 runs over time | Medium | Medium | Prioritise Schedule page over CRUD polish |
| CORS misconfiguration after deploy | Medium | Medium | Test immediately after setting up backend; keep CORS origins in env var |

---

## Dependencies Between Phases

```
Phase 1 ──► Phase 2 ──► Phase 3
     └─────────────────────────► Phase 4
```

Phases 1 and 2 are backend-only and can be completed before the frontend is started. Phase 4 requires all other phases to be functionally complete.
