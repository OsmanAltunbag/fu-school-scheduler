# Acceptance Criteria Checklists

Use these checklists to verify each user story before marking it complete.

---

## User Story 1 — Admin Configures Entities

### Teachers
- [ ] Admin can open the Teachers page and see an empty list on first run
- [ ] Admin can add a teacher with a name and at least one available slot
- [ ] The 5×8 availability grid renders all 40 slots
- [ ] Clicking a slot toggles its selected state
- [ ] Saving persists the teacher; they appear in the list on reload
- [ ] Admin can edit an existing teacher's name and availability
- [ ] Admin can delete a teacher not assigned to any course
- [ ] Saving a teacher with no available slots shows a validation error

### Courses
- [ ] Admin can create a course selecting subject, class group, teacher, weekly hours
- [ ] Dropdowns are populated from the database
- [ ] Saving a course with `weekly_hours > teacher.available_slots` shows a validation error
- [ ] Saving a duplicate (same subject + class) shows a validation error
- [ ] Created course appears in the list with all details

---

## User Story 2 — Admin Generates a Schedule

- [ ] "Generate Schedule" button is visible on the Schedule page
- [ ] Clicking shows a loading indicator while the solver runs
- [ ] On success, a schedule grid renders (5 days × 8 periods)
- [ ] Each occupied cell shows subject name and teacher name
- [ ] Selecting a class from the dropdown filters the grid
- [ ] After page reload, the last schedule is still visible
- [ ] Generated schedule has zero constraint violations (automated test)

---

## User Story 3 — Conflict Report on Infeasible Input

- [ ] Overcommitted class → conflict report shown (not a grid, not a 500 error)
- [ ] Overcommitted teacher → conflict report shown
- [ ] human_message explains the problem in plain English
- [ ] Each conflict shows: entity, description, suggestion
- [ ] "Try Again" button visible; re-triggers generation after data adjustment
- [ ] API returns 422 (not 500) for all infeasible cases

---

## User Story 4 — Multiple Schedule Views

- [ ] Class dropdown filters grid to that class's courses
- [ ] Teacher dropdown filters grid to that teacher's courses
- [ ] Empty state shown when no schedule exists
- [ ] Empty cells are visually distinct from occupied cells

---

## Edge Cases

- [ ] Generate with no courses → 422 with clear message
- [ ] Solver timeout → timeout-specific error, not generic failure
- [ ] Teacher with 0 available slots → rejected at save time
- [ ] Delete teacher assigned to course → blocked with error

---

## Non-Functional

- [ ] Generation < 10s for demo dataset (3 teachers, 3 classes, 9 courses)
- [ ] CRUD API responses < 500ms
- [ ] `/docs` OpenAPI UI renders all endpoints
- [ ] App renders correctly at 1280px in Chrome, Firefox, Safari
