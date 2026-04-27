# CLAUDE.md

> This file is automatically read by Claude Code at the start of every session. It contains essential project information and development conventions.

## Project Overview

A school timetabling web application built for the Fu Enerji technical assignment. It allows a school administrator to create and manage weekly class schedules.

**Core problem:** Constraint Satisfaction — generate a schedule that satisfies teacher availability, teacher/class uniqueness per time slot, and weekly lesson-hour requirements.

## Tech Stack

- **Backend:** FastAPI (Python 3.11+), SQLAlchemy 2.0, Pydantic v2
- **Database:** SQLite (file-based, single-user MVP)
- **Solver:** Google OR-Tools CP-SAT
- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS
- **Deploy:** Vercel (frontend) + Render (backend) — optional

## Source of Truth: `specs/`

**Read the relevant spec file before writing any code:**

| File | Contents |
|------|----------|
| `specs/01-decisions.md` | Problem approach, assumptions, alternative analysis |
| `specs/02-architecture.md` | Layer responsibilities, folder structure |
| `specs/03-data-model.md` | Entities, fields, invariants, constraint mapping |
| `specs/04-class-diagram.puml` | Class hierarchy and relationships |
| `specs/05-sequence-generate-schedule.puml` | Happy path flow |
| `specs/06-sequence-infeasibility.puml` | Conflict report flow |
| `specs/07-api-spec.md` | REST endpoint contracts |

If code and spec diverge: **give the spec priority. Update the spec if needed, then reflect the change in code.** Never silently violate the spec.

## Development Conventions

### Backend

- **Layering:** API → Service → Repository → DB. Services must not touch ORM models directly.
- **Dependency Injection:** Use FastAPI `Depends()`. Repositories and Services must be injectable via interface (Protocol / ABC).
- **DTO separation:** SQLAlchemy models ≠ Pydantic schemas. Keep them in separate directories (`models/` vs `schemas/`).
- **Scheduler:** Always behind the `IScheduler` interface. The Service receives an `IScheduler` dependency, never a concrete `ORToolsScheduler` instance.
- **Tests:** `pytest`. Test the scheduler without a database (pure functions); test services with in-memory repositories.

### Frontend

- **Server Components by default.** Use `'use client'` only where interaction requires it.
- **Data fetching:** Server components use `fetch`; client components use SWR.
- **API client:** A single typed wrapper in `lib/api.ts`. All endpoint URLs live there.
- **State:** Local `useState` is sufficient; do not add global state libraries (no Zustand, no Redux).
- **Styling:** Tailwind utility classes only. Do not create component-specific CSS files.

### General

- **Language:** Code, variable names, commit messages → **English**. UI text → **English**. Comments → English.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
- **Linting:** Backend: `ruff` + `mypy`. Frontend: `eslint` + `prettier`.

## Workflow with Claude Code

Spec-driven approach:

1. **Before starting any feature or module**, read the relevant spec file.
2. **Before implementation**, sketch a short plan (file list + function signatures at minimum).
3. **Write tests first** — especially for the scheduler and constraint validation.
4. **Write the code**, run the tests.
5. **Update the spec** if implementation revealed gaps or errors in the original design.

### Recommended 2-Day Development Order

**Day 1 — Backend & solver (target: 8-10 h):**
1. `backend/` skeleton — FastAPI + SQLAlchemy + Alembic
2. Domain models + migrations
3. CRUD endpoints (Teachers, Classes, Subjects, Courses)
4. TimeSlot seed
5. **`ORToolsScheduler` + unit tests** ⬅ highest-risk item; tackle it early
6. `FeasibilityChecker` + `ConflictReporter`
7. `POST /schedule/generate` endpoint
8. Manual testing (Postman / httpie)

**Day 2 — Frontend & deploy (target: 8-10 h):**
1. Next.js skeleton + Tailwind
2. CRUD pages (Teacher, Class, Subject, Course)
3. `ScheduleGrid` component (weekly grid visualisation)
4. `ConflictReport` component
5. "Generate" flow integration
6. README + Decisions doc — finalise
7. Deploy (Vercel + Render)
8. Presentation slides

## Common Pitfalls

- **OR-Tools install:** `pip install ortools` — large binary (~80 MB). Do not forget to include it in the Dockerfile.
- **SQLite + threading:** FastAPI defaults to async; SQLite requires `check_same_thread=False` for a single shared connection.
- **CORS:** After deploying the frontend, update the allowed origins in the FastAPI CORS middleware.
- **TimeSlot UUIDs:** Generate deterministic UUIDs for time slots (e.g. `uuid5` from `(day, period)`) to make tests reproducible.
- **Course validation:** Catch `weekly_hours > len(teacher.available_slots)` in the pre-check layer — sending this to the solver wastes time.

## Out of Scope (MVP)

Do **not** add the following:

- Authentication / authorisation
- Soft constraints (teacher preferences, balanced lesson distribution)
- Drag-and-drop manual editing
- Multi-tenancy (multiple schools)
- Real-time updates (WebSocket)
- Email / PDF export

If the user requests something in this list, clarify scope first, add it to the spec, then implement.
