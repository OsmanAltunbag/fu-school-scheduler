from ortools.sat.python import cp_model

from app.scheduling.feasibility_checker import FeasibilityChecker
from app.scheduling.interfaces import (
    AssignedEntry,
    IScheduler,
    SchedulingInput,
    SchedulingResult,
)


class ORToolsScheduler(IScheduler):
    def solve(self, input: SchedulingInput) -> SchedulingResult:
        early = FeasibilityChecker().check(input)
        if early is not None:
            return early

        model = cp_model.CpModel()

        x: dict = {}
        for course in input.courses:
            for slot in input.slots:
                x[(course.id, slot.id)] = model.new_bool_var(
                    f"x_{course.id}_{slot.id}"
                )

        teacher_available: dict[object, set] = {
            t.id: t.available_slot_ids for t in input.teachers
        }

        # C1 — teacher unavailability
        for course in input.courses:
            available = teacher_available.get(course.teacher_id, set())
            for slot in input.slots:
                if slot.id not in available:
                    model.add(x[(course.id, slot.id)] == 0)

        # C2 — teacher teaches at most one course per slot
        teacher_courses: dict = {}
        for course in input.courses:
            teacher_courses.setdefault(course.teacher_id, []).append(course.id)

        for t_id, course_ids in teacher_courses.items():
            for slot in input.slots:
                model.add_at_most_one(x[(c_id, slot.id)] for c_id in course_ids)

        # C3 — class has at most one course per slot
        class_courses: dict = {}
        for course in input.courses:
            class_courses.setdefault(course.class_group_id, []).append(course.id)

        for cg_id, course_ids in class_courses.items():
            for slot in input.slots:
                model.add_at_most_one(x[(c_id, slot.id)] for c_id in course_ids)

        # C4 — each course runs exactly weekly_hours times
        for course in input.courses:
            model.add(
                sum(x[(course.id, slot.id)] for slot in input.slots) == course.weekly_hours
            )

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 10.0

        status = solver.solve(model)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            entries = [
                AssignedEntry(course_id=c_id, slot_id=s_id)
                for (c_id, s_id), var in x.items()
                if solver.value(var) == 1
            ]
            return SchedulingResult(success=True, entries=entries)

        if status == cp_model.INFEASIBLE:
            return SchedulingResult(
                success=False,
                infeasibility_type="SOLVER_UNSAT",
                human_message=(
                    "No valid schedule exists with the current configuration. "
                    "Try adjusting teacher availability or course hours."
                ),
                conflicts=[],
            )

        # UNKNOWN → timeout
        return SchedulingResult(
            success=False,
            infeasibility_type="SOLVER_TIMEOUT",
            human_message=(
                "Schedule generation timed out after 10 seconds. "
                "Try reducing the number of courses."
            ),
            conflicts=[],
        )
