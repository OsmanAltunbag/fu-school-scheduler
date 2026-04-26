from uuid import uuid4

from app.scheduling.interfaces import (
    ClassGroupInfo,
    CourseInfo,
    SchedulingInput,
    SlotInfo,
    TeacherInfo,
)
from app.scheduling.ortools_scheduler import ORToolsScheduler


def _make_slots(n: int) -> list[SlotInfo]:
    days = ["MON", "TUE", "WED", "THU", "FRI"]
    return [SlotInfo(id=uuid4(), day=days[i % 5], period=(i // 5) + 1) for i in range(n)]


def test_trivial_feasible():
    """1 teacher (20 slots), 1 class, 1 course (2h) → SUCCESS with exactly 2 entries."""
    slots = _make_slots(20)
    slot_ids = {s.id for s in slots}

    teacher = TeacherInfo(id=uuid4(), name="T1", available_slot_ids=slot_ids)
    class_group = ClassGroupInfo(id=uuid4(), name="5A")
    course = CourseInfo(id=uuid4(), teacher_id=teacher.id, class_group_id=class_group.id, weekly_hours=2)

    inp = SchedulingInput(
        courses=[course],
        slots=slots,
        teachers=[teacher],
        class_groups=[class_group],
    )

    result = ORToolsScheduler().solve(inp)

    assert result.success is True
    assert len(result.entries) == 2
    assert all(e.course_id == course.id for e in result.entries)


def test_teacher_conflict():
    """Teacher with 3 available slots cannot cover 2 courses totaling 4h → not successful."""
    all_slots = _make_slots(10)
    teacher_slots = {s.id for s in all_slots[:3]}

    teacher = TeacherInfo(id=uuid4(), name="T2", available_slot_ids=teacher_slots)
    class_a = ClassGroupInfo(id=uuid4(), name="6A")
    class_b = ClassGroupInfo(id=uuid4(), name="6B")

    courses = [
        CourseInfo(id=uuid4(), teacher_id=teacher.id, class_group_id=class_a.id, weekly_hours=2),
        CourseInfo(id=uuid4(), teacher_id=teacher.id, class_group_id=class_b.id, weekly_hours=2),
    ]

    inp = SchedulingInput(
        courses=courses,
        slots=all_slots,
        teachers=[teacher],
        class_groups=[class_a, class_b],
    )

    result = ORToolsScheduler().solve(inp)

    assert result.success is False
    assert result.infeasibility_type in ("TEACHER_OVERCOMMIT", "SOLVER_UNSAT")


def test_multi_entity():
    """3 teachers, 2 classes, 5 courses → SUCCESS with zero slot conflicts."""
    slots = _make_slots(20)
    slot_ids = {s.id for s in slots}

    t1 = TeacherInfo(id=uuid4(), name="Math", available_slot_ids=slot_ids)
    t2 = TeacherInfo(id=uuid4(), name="Science", available_slot_ids=slot_ids)
    t3 = TeacherInfo(id=uuid4(), name="Art", available_slot_ids=slot_ids)

    c1 = ClassGroupInfo(id=uuid4(), name="5A")
    c2 = ClassGroupInfo(id=uuid4(), name="5B")

    courses = [
        CourseInfo(id=uuid4(), teacher_id=t1.id, class_group_id=c1.id, weekly_hours=3),
        CourseInfo(id=uuid4(), teacher_id=t2.id, class_group_id=c1.id, weekly_hours=2),
        CourseInfo(id=uuid4(), teacher_id=t3.id, class_group_id=c1.id, weekly_hours=2),
        CourseInfo(id=uuid4(), teacher_id=t1.id, class_group_id=c2.id, weekly_hours=3),
        CourseInfo(id=uuid4(), teacher_id=t2.id, class_group_id=c2.id, weekly_hours=2),
    ]

    teacher_by_course = {c.id: c.teacher_id for c in courses}
    class_by_course = {c.id: c.class_group_id for c in courses}

    inp = SchedulingInput(
        courses=courses,
        slots=slots,
        teachers=[t1, t2, t3],
        class_groups=[c1, c2],
    )

    result = ORToolsScheduler().solve(inp)

    assert result.success is True

    # verify no teacher teaches two courses in the same slot
    from collections import defaultdict
    teacher_slot_uses: dict = defaultdict(set)
    class_slot_uses: dict = defaultdict(set)

    for entry in result.entries:
        t_id = teacher_by_course[entry.course_id]
        cg_id = class_by_course[entry.course_id]
        assert entry.slot_id not in teacher_slot_uses[t_id], "Teacher double-booked"
        assert entry.slot_id not in class_slot_uses[cg_id], "Class double-booked"
        teacher_slot_uses[t_id].add(entry.slot_id)
        class_slot_uses[cg_id].add(entry.slot_id)


def test_empty_input():
    """No courses → SUCCESS with empty entries list."""
    slots = _make_slots(5)

    inp = SchedulingInput(
        courses=[],
        slots=slots,
        teachers=[],
        class_groups=[],
    )

    result = ORToolsScheduler().solve(inp)

    assert result.success is True
    assert result.entries == []
