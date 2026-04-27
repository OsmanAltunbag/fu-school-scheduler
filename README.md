<div align="center">

# 🗓️ Smart School Scheduler

**An AI-powered school timetabling system that eliminates scheduling conflicts through Constraint Satisfaction.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![OR-Tools](https://img.shields.io/badge/OR--Tools-CP--SAT-4285F4?style=flat-square&logo=google)](https://developers.google.com/optimization)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)](https://sqlite.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

[Live Demo](https://fu-school-scheduler.vercel.app) · [API Docs](https://fu-school-scheduler.onrender.com/docs) · [Design Specs](specs/001-school-scheduler/spec.md)

</div>

---

## Overview

School timetabling is a classic **Constraint Satisfaction Problem (CSP)**. Manually creating a weekly schedule that satisfies teacher availability, avoids double-booking, and meets lesson-hour requirements is error-prone and time-consuming.

This system automates that process. An admin configures teachers, class groups, subjects, and courses — then clicks **Generate Schedule**. The CP-SAT solver finds a feasible assignment in seconds. If no valid schedule exists, the system explains exactly why with actionable suggestions.

---

## Key Features

- **Constraint Satisfaction Engine** — Google OR-Tools CP-SAT solver enforces 4 hard constraints
- **Conflict Reporter** — Human-readable explanation when a schedule is infeasible, with per-conflict fix suggestions
- **Interactive Schedule Grid** — Weekly 5×8 timetable filterable by class group or teacher
- **Full CRUD** — Manage teachers (with availability grid), class groups, subjects, and courses
- **Spec-Driven Development** — Built from comprehensive design specifications ([`specs/`](specs/))

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS | UI and schedule grid |
| Backend | FastAPI, Python 3.11, Pydantic v2, SQLAlchemy 2.0 | REST API and business logic |
| Solver | Google OR-Tools CP-SAT | Constraint satisfaction engine |
| Database | SQLite | Persistence (zero-config, single-user) |
| Deploy | Vercel + Render | Frontend + Backend hosting |

---

## Enforced Constraints

| ID | Rule |
|----|------|
| C1 | A teacher is never placed in a slot they marked unavailable |
| C2 | A teacher teaches at most one course per time slot |
| C3 | A class group has at most one lesson per time slot |
| C4 | Each course appears exactly its required number of times per week |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- `pip` or `uv`

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run database migrations and seed time slots
alembic upgrade head
python -m app.seed

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Start the development server
npm run dev
```

App available at: `http://localhost:3000`

### Run Tests

```bash
cd backend
pytest -v
```

---

## Project Structure

```
fu-school-scheduler/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routers
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── repositories/   # Database access layer
│   │   ├── services/       # Business logic
│   │   └── scheduling/     # OR-Tools solver engine
│   │       ├── interfaces.py
│   │       ├── ortools_scheduler.py
│   │       ├── feasibility_checker.py
│   │       └── conflict_reporter.py
│   └── tests/
├── frontend/
│   ├── app/                # Next.js App Router pages
│   ├── components/
│   │   ├── ScheduleGrid.tsx
│   │   └── ConflictReport.tsx
│   └── lib/
│       └── api.ts          # Typed API client
├── specs/
│   └── 001-school-scheduler/
│       ├── spec.md         # Full feature specification
│       ├── data-model.md   # Entity schema + CP-SAT mapping
│       ├── plan.md         # Implementation plan
│       ├── tasks.md        # Task checklist
│       ├── checklists/     # Acceptance criteria
│       └── contracts/      # API contracts + TypeScript types
├── CLAUDE.md               # Claude Code project memory
└── README.md
```

---

## Architecture

The system follows a strict layered architecture:

```
Frontend (Next.js)
      │  REST + JSON
      ▼
API Layer (FastAPI routers)       ← HTTP concerns only
      │
Service Layer                     ← Business rules
      │          │
Repository    Scheduling Engine   ← IScheduler interface
Layer              │
      │       ORToolsScheduler    ← CP-SAT implementation
      ▼
   SQLite
```

**Key design decisions:**
- The solver sits behind an `IScheduler` interface (Dependency Inversion) — swapping OR-Tools for another solver requires no changes in the service layer
- `FeasibilityChecker` catches trivially infeasible inputs before the solver is invoked, enabling faster and more specific error messages
- `ConflictReporter` translates solver failures into human-readable explanations with actionable suggestions

---

## API Documentation

FastAPI auto-generates interactive API docs. After starting the backend:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

Core endpoint:
```
POST /api/schedule/generate   → 200 ScheduleDTO | 422 ConflictReport
GET  /api/schedule/latest     → 200 ScheduleDTO | 404
GET  /api/schedule/by-class/{id}
GET  /api/schedule/by-teacher/{id}
```

Full contract: [`specs/001-school-scheduler/contracts/api-contract.md`](specs/001-school-scheduler/contracts/api-contract.md)

---

## Problem Approach

> This section answers the technical brief's questions on problem definition, assumptions, constraints, and solution rationale.

### Problem Definition

This is a **Constraint Satisfaction Problem (CSP)** — specifically a Timetabling Problem. The decision variable for each `(course, timeslot)` pair is a boolean: `x[c, t] ∈ {0, 1}`. The objective is to find a feasible assignment (not to optimize), which means finding any assignment that satisfies all four hard constraints.

### Assumptions

1. Fixed time grid: 5 days × 8 periods = 40 slots (not user-configurable in MVP)
2. Single teacher per course; atomic 1-slot periods (no double periods)
3. Single admin user; no authentication required (per brief)
4. SQLite is sufficient for single-user, zero-config MVP deployment

### Why OR-Tools CP-SAT?

| Approach | Verdict |
|----------|---------|
| Greedy + constraint check | Rejected — no backtracking, dead-ends frequently |
| Manual backtracking CSP | Rejected — high boilerplate, arc-consistency hand-coded |
| Genetic / Simulated Annealing | Rejected — no feasibility guarantee, hard to explain failures |
| **OR-Tools CP-SAT** | **Selected** — production-grade, built-in INFEASIBLE detection, declarative API |

OR-Tools is used in Google's internal scheduling systems. The model formulation, constraint design, and infeasibility explanation logic are original work; OR-Tools handles the search.

### Constraints Not Included (Out of Scope)

Soft constraints (teacher preferences, lesson distribution balance), room assignment, drag-and-drop editing, authentication, multi-tenancy, notifications, and export features are explicitly out of scope for this MVP.

---

## Live Demo

| | URL |
|--|-----|
| Frontend | https://fu-school-scheduler.vercel.app |
| Backend API Docs | https://fu-school-scheduler.onrender.com/docs |

---

## AI Tool Usage

This project was developed using Spec-Driven Development (SDD) with Claude Code as an AI pair-programmer. All architectural decisions, constraint modeling, and problem formulation were done by the developer. Claude Code was used to accelerate implementation based on pre-written specifications in the `specs/` folder.

---

## Development Methodology

This project was built using **Spec-Driven Development (SDD)**:

1. Problem decomposed into user stories with acceptance criteria
2. Data model and CP-SAT constraint mapping defined before any code
3. API contracts written before implementation
4. Claude Code used as an AI pair-programmer, guided by `CLAUDE.md` and the `specs/` folder

The full specification lives in [`specs/001-school-scheduler/`](specs/001-school-scheduler/).

---

## License

MIT — see [LICENSE](LICENSE)
