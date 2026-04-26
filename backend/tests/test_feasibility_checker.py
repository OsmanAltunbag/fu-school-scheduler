from uuid import uuid4

from app.scheduling.feasibility_checker import FeasibilityChecker
from app.scheduling.interfaces import (
    ClassGroupInfo,
    CourseInfo,
    SchedulingInput,
    SlotInfo,
    TeacherInfo,
)


def _make_slots(n: int) -> list[SlotInfo]:
    days = ["MON", "TUE", "WED", "THU", "FRI"]
    slots = []
    for i in range(n):
        slots.append(SlotInfo(id=uuid4(), day=days[i % 5], period=(i // 5) + 1))
    return slots


def test_class_overcommit():
    """Class with 41 total weekly hours must fail CLASS_OVERCOMMIT."""
    slots = _make_slots(45)
    slot_ids = {s.id for s in slots}

    teacher = TeacherInfo(id=uuid4(), name="T1", available_slot_ids=slot_ids)
    class_group = ClassGroupInfo(id=uuid4(), name="5A")

    courses = [
        CourseInfo(id=uuid4(), teacher_id=teacher.id, class_group_id=class_group.id, weekly_hours=21),
        CourseInfo(id=uuid4(), teacher_id=teacher.id, class_group_id=class_group.id, weekly_hours=20),
    ]

    inp = SchedulingInput(
        courses=courses,
        slots=slots,
        teachers=[teacher],
        class_groups=[class_group],
    )

    result = FeasibilityChecker().check(inp)

    assert result is not None
    assert result.success is False
    assert result.infeasibility_type == "CLASS_OVERCOMMIT"


def test_teacher_overcommit():
    """Teacher assigned 5h but only 3 available slots must fail TEACHER_OVERCOMMIT."""
    all_slots = _make_slots(10)
    teacher_slots = set(s.id for s in all_slots[:3])

    teacher = TeacherInfo(id=uuid4(), name="T2", available_slot_ids=teacher_slots)
    class_group = ClassGroupInfo(id=uuid4(), name="6B")

    courses = [
        CourseInfo(id=uuid4(), teacher_id=teacher.id, class_group_id=class_group.id, weekly_hours=3),
        CourseInfo(id=uuid4(), teacher_id=teacher.id, class_group_id=class_group.id, weekly_hours=2),
    ]

    inp = SchedulingInput(
        courses=courses,
        slots=all_slots,
        teachers=[teacher],
        class_groups=[class_group],
    )

    result = FeasibilityChecker().check(inp)

    assert result is not None
    assert result.success is False
    assert result.infeasibility_type == "TEACHER_OVERCOMMIT"


def test_all_clear():
    """Valid input — no overcommit, no missing availability — must return None."""
    slots = _make_slots(20)
    slot_ids = {s.id for s in slots}

    teacher = TeacherInfo(id=uuid4(), name="T3", available_slot_ids=slot_ids)
    class_group = ClassGroupInfo(id=uuid4(), name="7C")

    courses = [
        CourseInfo(id=uuid4(), teacher_id=teacher.id, class_group_id=class_group.id, weekly_hours=3),
        CourseInfo(id=uuid4(), teacher_id=teacher.id, class_group_id=class_group.id, weekly_hours=4),
    ]

    inp = SchedulingInput(
        courses=courses,
        slots=slots,
        teachers=[teacher],
        class_groups=[class_group],
    )

    result = FeasibilityChecker().check(inp)

    assert result is None
