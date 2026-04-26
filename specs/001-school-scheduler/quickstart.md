# Quickstart: School Timetabling System

This guide gets you from zero to a running dev environment and shows how to use this spec with GitHub Copilot or Claude Code.

---

## Prerequisites

- Python 3.11+ and `uv` (or `pip`)
- Node.js 20+
- Git

---

## 1. Clone and Structure

```bash
git clone <your-repo-url>
cd fu-enerji-scheduler
```

Expected structure:
```
fu-enerji-scheduler/
├── backend/
├── frontend/
├── specs/
│   └── 001-school-scheduler/
│       ├── spec.md          ← full feature spec
│       ├── SUMMARY.md       ← one-page overview
│       ├── data-model.md    ← entities + schema
│       ├── plan.md          ← phased implementation plan
│       ├── quickstart.md    ← this file
│       ├── tasks.md         ← granular task checklist
│       ├── checklists/      ← acceptance criteria per story
│       └── contracts/       ← API contracts
└── CLAUDE.md
```

---

## 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install fastapi uvicorn sqlalchemy alembic pydantic ortools pytest httpx

# Run migrations and seed
alembic upgrade head
python -m app.seed

# Start the server
uvicorn app.main:app --reload --port 8000
```

Verify: `http://localhost:8000/docs` → OpenAPI UI loads.

---

## 3. Frontend Setup

```bash
cd frontend

npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000/api

npm run dev
```

Verify: `http://localhost:3000` → navigation renders.

---

## 4. Run Tests

```bash
cd backend
pytest -v
```

Expected: all tests in `tests/test_ortools_scheduler.py` and `tests/test_feasibility_checker.py` pass.

---

## 5. Using This Spec with GitHub Copilot

Open the repo in VS Code with GitHub Copilot enabled.

**Best practice:** Open the relevant spec file as context before asking Copilot to generate code.

### Example workflow

1. Open `specs/001-school-scheduler/data-model.md` in a tab.
2. Open `backend/app/models/course.py` (new or existing).
3. In Copilot Chat, type:
   ```
   @workspace Based on the data model in data-model.md, generate the SQLAlchemy model for Course, including the unique constraint on (subject_id, class_group_id).
   ```

4. For the scheduler:
   ```
   @workspace Based on spec.md FR-009 through FR-013 and the CP-SAT constraint mapping in data-model.md, implement the ORToolsScheduler class in backend/app/scheduling/ortools_scheduler.py
   ```

5. For tests:
   ```
   @workspace Based on the acceptance scenarios in spec.md User Story 3, generate pytest test cases for the ORToolsScheduler covering: trivial feasible case, teacher conflict, class overcommit, and multi-entity.
   ```

### Tip

Keep `spec.md` open in a pinned tab. Copilot's context window will pick it up for all completions in the workspace.

---

## 6. Using This Spec with Claude Code

```bash
# From repo root
claude
```

Inside Claude Code:
```
/init    # reads CLAUDE.md and indexes the project
```

Then paste prompts from `tasks.md` one phase at a time.

---

## 7. First End-to-End Test

1. Open `http://localhost:3000/teachers` → add "Jane Smith" with 20 available slots
2. Open `/classes` → add "9-A" (grade 9)
3. Open `/subjects` → add "Mathematics"
4. Open `/courses` → add: Mathematics / 9-A / Jane Smith / 4 weekly hours
5. Open `/schedule` → click "Generate Schedule"
6. Verify a grid appears with 4 Mathematics slots assigned to Jane Smith

Expected result: schedule grid with no conflicts.

To test the conflict report:
- Go to `/courses` → add more courses until Jane Smith's total exceeds her available slots
- Click "Generate Schedule" → a conflict report should appear instead of a grid
