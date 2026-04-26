from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.schedule import Schedule, ScheduleEntry, ScheduleStatus
from app.repositories import course_repo, schedule_repo, teacher_repo, time_slot_repo
from app.scheduling.interfaces import (
    ClassGroupInfo,
    CourseInfo,
    SchedulingInput,
    SlotInfo,
    TeacherInfo,
)
from app.scheduling.ortools_scheduler import ORToolsScheduler


def generate(db: Session) -> tuple[Schedule, None] | tuple[None, dict]:
    courses = course_repo.get_all(db)
    teachers = teacher_repo.get_all(db)
    slots = time_slot_repo.get_all(db)

    teacher_infos = [
        TeacherInfo(
            id=t.id,
            name=t.name,
            available_slot_ids={s.id for s in t.available_slots},
        )
        for t in teachers
    ]

    seen_cg: dict = {}
    for c in courses:
        cg = c.class_group
        seen_cg[cg.id] = ClassGroupInfo(id=cg.id, name=cg.name)

    course_infos = [
        CourseInfo(
            id=c.id,
            teacher_id=c.teacher_id,
            class_group_id=c.class_group_id,
            weekly_hours=c.weekly_hours,
        )
        for c in courses
    ]

    slot_infos = [
        SlotInfo(id=s.id, day=s.day.value, period=s.period)
        for s in slots
    ]

    scheduling_input = SchedulingInput(
        courses=course_infos,
        slots=slot_infos,
        teachers=teacher_infos,
        class_groups=list(seen_cg.values()),
    )

    result = ORToolsScheduler().solve(scheduling_input)

    if not result.success:
        return None, {
            "type": result.infeasibility_type,
            "human_message": result.human_message,
            "conflicts": result.conflicts or [],
        }

    schedule = Schedule(
        generated_at=datetime.now(timezone.utc),
        status=ScheduleStatus.SUCCESS,
    )
    schedule.entries = [
        ScheduleEntry(course_id=str(e.course_id), time_slot_id=str(e.slot_id))
        for e in result.entries
    ]

    saved = schedule_repo.save(db, schedule)
    return saved, None
