from app.scheduling.interfaces import AssignedEntry, CourseInfo, SchedulingInput, SchedulingResult


class FeasibilityChecker:
    def check(self, input: SchedulingInput) -> SchedulingResult | None:
        result = self._check_class_overcommit(input)
        if result:
            return result

        result = self._check_teacher_overcommit(input)
        if result:
            return result

        result = self._check_teacher_availability_insufficient(input)
        if result:
            return result

        return None

    def _check_class_overcommit(self, input: SchedulingInput) -> SchedulingResult | None:
        class_hours: dict = {}
        for course in input.courses:
            class_hours[course.class_group_id] = (
                class_hours.get(course.class_group_id, 0) + course.weekly_hours
            )

        class_map = {cg.id: cg.name for cg in input.class_groups}

        for cg_id, total in class_hours.items():
            if total > 40:
                name = class_map.get(cg_id, str(cg_id))
                return SchedulingResult(
                    success=False,
                    entries=[],
                    infeasibility_type="CLASS_OVERCOMMIT",
                    human_message=(
                        f"Class {name} requires {total} weekly hours but the week only has 40 slots."
                    ),
                    conflicts=[
                        {
                            "entity": f"ClassGroup:{name}",
                            "description": f"Total weekly hours ({total}) > 40",
                            "suggestion": "Reduce weekly hours of one course in this class.",
                        }
                    ],
                )
        return None

    def _check_teacher_overcommit(self, input: SchedulingInput) -> SchedulingResult | None:
        teacher_hours: dict = {}
        for course in input.courses:
            teacher_hours[course.teacher_id] = (
                teacher_hours.get(course.teacher_id, 0) + course.weekly_hours
            )

        teacher_map = {t.id: t for t in input.teachers}

        for t_id, total in teacher_hours.items():
            teacher = teacher_map.get(t_id)
            if teacher is None:
                continue
            available = len(teacher.available_slot_ids)
            if total > available:
                return SchedulingResult(
                    success=False,
                    entries=[],
                    infeasibility_type="TEACHER_OVERCOMMIT",
                    human_message=(
                        f"Teacher {teacher.name} is assigned {total} hours but only has "
                        f"{available} available slots."
                    ),
                    conflicts=[
                        {
                            "entity": f"Teacher:{teacher.name}",
                            "description": f"Assigned hours ({total}) > available slots ({available})",
                            "suggestion": "Add more availability or reduce assigned course hours.",
                        }
                    ],
                )
        return None

    def _check_teacher_availability_insufficient(
        self, input: SchedulingInput
    ) -> SchedulingResult | None:
        teacher_map = {t.id: t for t in input.teachers}

        for course in input.courses:
            teacher = teacher_map.get(course.teacher_id)
            if teacher is None:
                continue
            available = len(teacher.available_slot_ids)
            if course.weekly_hours > available:
                return SchedulingResult(
                    success=False,
                    entries=[],
                    infeasibility_type="TEACHER_AVAILABILITY_INSUFFICIENT",
                    human_message=(
                        f"Teacher {teacher.name} does not have enough available slots "
                        f"for course {course.id}."
                    ),
                    conflicts=[
                        {
                            "entity": f"Teacher:{teacher.name}",
                            "description": (
                                f"Course requires {course.weekly_hours} hours but teacher "
                                f"only has {available} available slots."
                            ),
                            "suggestion": (
                                "Add more available slots to the teacher or reduce "
                                "the course's weekly hours."
                            ),
                        }
                    ],
                )
        return None
