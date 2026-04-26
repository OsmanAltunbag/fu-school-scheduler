# Data Model: School Timetabling System

## Entity Overview

```
Teacher ──────────────────────────────── TimeSlot
  │  (M2M via teacher_availability)        │
  │                                        │
  └── 1:N ── Course                        │
               │                           │
ClassGroup ──► Course ◄── Subject          │
                │                          │
                └── N:1 ── ScheduleEntry ──┘
                               │
                          Schedule (1:N)
```

---

## Entities

### Teacher

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | Generated on insert |
| name | VARCHAR(255) | NOT NULL | Full name, e.g. "Jane Smith" |

**Relationships:**
- `available_slots` → M2M with `TimeSlot` via `teacher_availability` join table
- `courses` → 1:N with `Course`

**Invariants:**
- Must have at least 1 available slot (service-level check)

---

### ClassGroup

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(50) | NOT NULL | e.g. "9-A" |
| grade_level | INTEGER | NOT NULL | 9, 10, 11, 12 |

**Relationships:**
- `courses` → 1:N with `Course`

---

### Subject

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL UNIQUE | e.g. "Mathematics" |

---

### Course *(schedulable unit)*

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| subject_id | UUID | FK → Subject, NOT NULL | |
| class_group_id | UUID | FK → ClassGroup, NOT NULL | |
| teacher_id | UUID | FK → Teacher, NOT NULL | |
| weekly_hours | INTEGER | NOT NULL, CHECK ≥ 1 | Hours per week |

**Unique constraint:** `(subject_id, class_group_id)` — a class cannot study the same subject twice.

**Invariants:**
- `weekly_hours` must not exceed `len(teacher.available_slots)` (service-level check)

---

### TimeSlot

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | Deterministic (uuid5 from day+period) |
| day | ENUM(MON,TUE,WED,THU,FRI) | NOT NULL | |
| period | INTEGER | NOT NULL, CHECK 1–8 | |

**Unique constraint:** `(day, period)`

**Note:** Seeded at startup. Not user-editable. 40 records total.

---

### teacher_availability (join table)

| Column | Type | Constraints |
|--------|------|-------------|
| teacher_id | UUID | FK → Teacher, NOT NULL |
| time_slot_id | UUID | FK → TimeSlot, NOT NULL |

**Primary key:** `(teacher_id, time_slot_id)`

---

### Schedule

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| generated_at | DATETIME | NOT NULL | UTC timestamp |
| status | ENUM(SUCCESS,FAILED) | NOT NULL | |
| failure_reason | TEXT | NULLABLE | JSON blob of ConflictReport when FAILED |

**Note:** Only the latest schedule is shown in the UI. Previous schedules are overwritten on new generation. (Simple MVP decision — no schedule history.)

---

### ScheduleEntry

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| schedule_id | UUID | FK → Schedule, ON DELETE CASCADE | |
| course_id | UUID | FK → Course, NOT NULL | |
| time_slot_id | UUID | FK → TimeSlot, NOT NULL | |

**Unique constraint:** `(schedule_id, course_id, time_slot_id)`

---

## CP-SAT Constraint Mapping

| ID | Domain Rule | OR-Tools Expression |
|----|-------------|---------------------|
| C1 | Teacher T unavailable at slot t | `model.Add(x[c,t] == 0)` for all courses c of teacher T |
| C2 | Teacher T teaches at most 1 course at slot t | `model.AddAtMostOne(x[c,t] for c in T.courses)` per t |
| C3 | ClassGroup G has at most 1 lesson at slot t | `model.AddAtMostOne(x[c,t] for c in G.courses)` per t |
| C4 | Course c runs exactly weekly_hours times | `model.Add(sum(x[c,t] for t in all_slots) == c.weekly_hours)` |

**Decision variable:** `x[course_id, slot_id] ∈ {0, 1}` for every (course, slot) pair.

---

## Pydantic Schema Overview

```python
# Request schemas (Create / Update)
class TeacherCreate(BaseModel):
    name: str
    available_slot_ids: list[UUID]

class ClassGroupCreate(BaseModel):
    name: str
    grade_level: int

class SubjectCreate(BaseModel):
    name: str

class CourseCreate(BaseModel):
    subject_id: UUID
    class_group_id: UUID
    teacher_id: UUID
    weekly_hours: int = Field(ge=1)

# Response schemas (Read)
class TeacherRead(BaseModel):
    id: UUID
    name: str
    available_slots: list[TimeSlotRead]

class CourseRead(BaseModel):
    id: UUID
    subject: SubjectRead
    class_group: ClassGroupRead
    teacher: TeacherRead
    weekly_hours: int

class ScheduleEntryRead(BaseModel):
    course: CourseRead
    time_slot: TimeSlotRead

class ScheduleRead(BaseModel):
    id: UUID
    generated_at: datetime
    status: Literal["SUCCESS", "FAILED"]
    entries: list[ScheduleEntryRead]

class ConflictReport(BaseModel):
    type: str   # CLASS_OVERCOMMIT | TEACHER_OVERCOMMIT | ... | SOLVER_UNSAT
    human_message: str
    conflicts: list[ConflictDetail]

class ConflictDetail(BaseModel):
    entity: str
    description: str
    suggestion: str | None
```
