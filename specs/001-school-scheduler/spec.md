# Feature Specification: School Timetabling System
Feature Branch: 001-school-scheduler
Created: April 2026
Status: Draft
Input: Design and develop a full-stack web application that allows a school administrator to create a weekly class schedule. The system must handle teachers, classes, subjects, and time slots, while respecting constraints: teacher availability, no double-booking of teachers or classes, and required weekly lesson hours per course. The system must also provide a conflict report when a schedule cannot be generated.

---

## User Scenarios & Testing (mandatory)

### User Story 1 — Admin Configures Entities (Priority: P1)

A school administrator needs to set up the foundational data before a schedule can be generated: teachers (with their weekly availability), student class groups, subjects, and courses (which bind a subject, a class group, a teacher, and a weekly hour count together).

**Why this priority:** Without entities, the scheduler has no input to work with. All other features depend on this data.

**Independent Test:** Create a teacher with 20 available slots, a class group "9-A", a subject "Mathematics", and a course linking them with 4 weekly hours. Verify all four records are persisted and retrievable via the API.

**Acceptance Scenarios:**

- Given an admin is on the Teachers page, When they fill in the name and select available time slots on the 5×8 grid, Then the teacher is saved and appears in the teacher list
- Given an admin is on the Classes page, When they enter a class name and grade level, Then the class group is created and visible
- Given an admin is on the Subjects page, When they enter a subject name, Then the subject is saved
- Given an admin is creating a Course, When they select a subject, class group, teacher, and weekly hours, Then the course is saved and linked correctly
- Given an admin enters a weekly hour count that exceeds the teacher's available slots, When they try to save, Then a validation error is shown and the course is not saved
- Given an admin tries to assign the same subject to the same class twice, When they save, Then the system rejects the duplicate with a clear error message

---

### User Story 2 — Admin Generates a Schedule (Priority: P1)

An admin has configured all entities and now wants to generate a weekly timetable. The system must produce a schedule that satisfies all hard constraints and display it as a grid.

**Why this priority:** This is the core value proposition of the system. Without it, the tool is just a data entry form.

**Independent Test:** With a valid set of courses, click "Generate Schedule". Verify the resulting schedule has no teacher or class conflicts, all courses appear the required number of times, and no course appears in a slot where the teacher is unavailable.

**Acceptance Scenarios:**

- Given all entity data is set up correctly, When the admin clicks "Generate Schedule", Then a schedule is produced and displayed within a reasonable time
- Given a schedule is generated, When the admin views it, Then it is presented as a weekly grid (days × periods) filterable by class group
- Given a schedule is generated, When the admin selects a teacher from the teacher view, Then only that teacher's lessons are shown in the grid
- Given the system has previously generated a schedule, When a new generation is triggered, Then the old schedule is replaced and the new one is displayed
- Given the schedule is generated successfully, When the admin reloads the page, Then the schedule is still visible (it is persisted)

---

### User Story 3 — Admin Receives a Conflict Report on Infeasible Input (Priority: P1)

When the configured data makes it impossible to produce a valid schedule, the system must explain why, rather than silently failing or spinning indefinitely.

**Why this priority:** Without explainability, the admin has no way to fix the problem. Conflict reporting turns a dead end into an actionable workflow.

**Independent Test:** Configure a class group with courses whose total weekly hours exceed 40. Click "Generate Schedule". Verify a 422 response is returned with a human-readable message identifying which class is overcommitted and a suggestion for resolution.

**Acceptance Scenarios:**

- Given a class's total weekly course hours exceed 40, When the admin clicks "Generate Schedule", Then a conflict report is shown explaining the class is overcommitted
- Given a teacher's total assigned hours exceed their available time slots, When generation is triggered, Then the conflict report identifies the specific teacher and the discrepancy
- Given the conflict report is displayed, When the admin reads it, Then each conflict includes a suggestion for how to resolve it
- Given the conflict report is shown, When the admin adjusts the data and retries, Then the system attempts generation again with the updated data
- Given the CP-SAT solver finds no feasible solution (constraints conflict interactively), When the admin is notified, Then the message distinguishes this from trivial overcommit cases

---

### User Story 4 — Admin Views Schedule by Class or Teacher (Priority: P2)

After generation, the admin needs to review the schedule from multiple perspectives: per class (to hand out to students) and per teacher (to confirm their workload).

**Why this priority:** A flat list of schedule entries is not usable in practice. Filtered views make the schedule actionable.

**Independent Test:** Generate a schedule with at least 3 class groups and 3 teachers. Verify that selecting "Class 9-A" shows only 9-A's lessons, and selecting "Teacher Jane Smith" shows only her lessons.

**Acceptance Scenarios:**

- Given a schedule exists, When the admin selects a class from the dropdown, Then only that class's lessons are shown in the grid
- Given a schedule exists, When the admin selects a teacher from the dropdown, Then only that teacher's lessons are shown in the grid
- Given a schedule exists, When the admin views a class grid, Then each cell clearly shows the subject name and teacher name
- Given a schedule exists, When the admin views a teacher grid, Then each cell clearly shows the subject name and class group name
- Given no schedule has been generated yet, When the admin opens the Schedule page, Then an empty state with a clear CTA ("Generate Schedule") is shown

---

## Edge Cases

- What happens when the admin clicks "Generate Schedule" with no courses configured?
- What happens if OR-Tools takes longer than 10 seconds to solve?
- What happens if two browser tabs trigger generation simultaneously?
- What happens when a teacher has zero available time slots?
- What if a course's weekly hours is set to 0?
- What if the database contains orphaned schedule entries after a course is deleted?
- What happens if the admin deletes a teacher who is assigned to an active course?
- What if the admin sets weekly hours to a number equal to exactly the teacher's available slots (edge of feasibility)?

---

## Requirements (mandatory)

### Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-001 | System MUST allow admins to create, read, update, and delete Teachers |
| FR-002 | System MUST allow admins to assign a set of available TimeSlots to each Teacher |
| FR-003 | System MUST allow admins to create, read, update, and delete ClassGroups |
| FR-004 | System MUST allow admins to create, read, update, and delete Subjects |
| FR-005 | System MUST allow admins to create, read, update, and delete Courses, each linking one Subject, one ClassGroup, one Teacher, and a weekly hour count |
| FR-006 | System MUST reject a Course where weekly_hours > number of teacher's available slots |
| FR-007 | System MUST reject a Course that creates a duplicate (same Subject + same ClassGroup) |
| FR-008 | System MUST seed 40 TimeSlots (5 days × 8 periods) on first startup |
| FR-009 | System MUST provide a "Generate Schedule" action that invokes the CP-SAT solver |
| FR-010 | System MUST enforce Constraint C1: a course is never placed in a slot where its teacher is unavailable |
| FR-011 | System MUST enforce Constraint C2: a teacher teaches at most one course per time slot |
| FR-012 | System MUST enforce Constraint C3: a class group has at most one course per time slot |
| FR-013 | System MUST enforce Constraint C4: each course appears exactly weekly_hours times in the generated schedule |
| FR-014 | System MUST perform a pre-check before invoking the solver and return a 422 with a ConflictReportDTO if trivially infeasible |
| FR-015 | System MUST return a 422 with a ConflictReportDTO if the solver returns INFEASIBLE |
| FR-016 | System MUST persist the latest generated schedule in the database |
| FR-017 | System MUST expose a GET endpoint returning the latest schedule |
| FR-018 | System MUST expose GET endpoints returning a schedule filtered by ClassGroup or Teacher |
| FR-019 | System MUST display the schedule as a 5×8 grid in the frontend |
| FR-020 | System MUST display the conflict report with human-readable messages and per-conflict suggestions |
| FR-021 | System MUST set a solver timeout of 10 seconds and return a timeout-specific error if exceeded |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-001 | Schedule generation MUST complete within 10 seconds for a typical school (≤ 10 teachers, ≤ 10 classes, ≤ 50 courses) |
| NFR-002 | All API responses MUST complete within 500ms (excluding schedule generation) |
| NFR-003 | The application MUST run correctly on a single-node SQLite setup |
| NFR-004 | All endpoints MUST be documented via FastAPI's auto-generated OpenAPI docs |

---

## Key Entities

**Teacher**
Represents an instructor. Contains: `id` (UUID), `name` (text), `available_slots` (M2M relationship to TimeSlot).

**ClassGroup**
Represents a student cohort, e.g. "9-A". Contains: `id` (UUID), `name` (text), `grade_level` (integer).

**Subject**
An abstract subject type, e.g. "Mathematics". Contains: `id` (UUID), `name` (text).

**Course** *(the schedulable unit)*
Binds a Subject to a ClassGroup, delivered by a Teacher for a fixed number of hours per week. Contains: `id` (UUID), `subject_id` (FK), `class_group_id` (FK), `teacher_id` (FK), `weekly_hours` (integer ≥ 1). Constraint: `(subject_id, class_group_id)` unique.

**TimeSlot**
A single cell in the weekly grid. Contains: `id` (UUID), `day` (enum: MON–FRI), `period` (integer 1–8). Constraint: `(day, period)` unique. Seeded at startup; not user-editable.

**Schedule**
The output of a solver run. Contains: `id` (UUID), `generated_at` (datetime), `status` (SUCCESS / FAILED), `failure_reason` (nullable text).

**ScheduleEntry**
A single assignment in a Schedule. Contains: `id` (UUID), `schedule_id` (FK), `course_id` (FK), `time_slot_id` (FK). Constraint: `(schedule_id, course_id, time_slot_id)` unique.

---

## Success Criteria (mandatory)

| ID | Criterion |
|----|-----------|
| SC-001 | An admin can configure all entities and trigger schedule generation in under 5 minutes on first use |
| SC-002 | Schedule generation completes in under 10 seconds for a dataset of ≤ 50 courses |
| SC-003 | The generated schedule contains zero constraint violations (verified by automated test) |
| SC-004 | When input is infeasible, 100% of cases produce a human-readable conflict report instead of a 500 error |
| SC-005 | The schedule grid renders correctly in Chrome, Firefox, and Safari |
| SC-006 | All 21 functional requirements have a corresponding passing automated test |

---

## Assumptions

1. **Single admin user:** No authentication is implemented. A single admin user operates the system.
2. **Fixed time grid:** The week consists of exactly 5 days × 8 periods = 40 slots. This is not user-configurable in the MVP.
3. **Single teacher per course:** Each course has exactly one assigned teacher.
4. **No room constraints:** Classroom/room assignment is outside the scope of this feature.
5. **Atomic periods:** Each lesson occupies exactly 1 time slot; double periods are not modeled.
6. **File storage:** No file attachments are required for this feature.
7. **Solver timeout:** OR-Tools CP-SAT is given a maximum of 10 seconds per generation attempt.
8. **SQLite:** A file-based SQLite database is sufficient for the single-user MVP.

---

## Dependencies

- **Depends On:** OR-Tools library (`pip install ortools`) must be installed in the backend runtime environment.
- **Depends On:** SQLite file storage with write permissions at the deployment path.
- **Related To:** Future features may add authentication, notifications, or multi-school support.
- **Blocked By:** None identified.

---

## Out of Scope

- User authentication or role-based access control
- Soft constraints (teacher preferences, lesson distribution balance, lunch breaks)
- Room / classroom assignment
- Drag-and-drop manual schedule editing
- Multi-tenancy (multiple schools)
- Export to PDF or Excel
- Email notifications on schedule generation
- Idea / comment workflows
- Audit logging beyond what SQLite provides
- Support for split classes or shared courses
