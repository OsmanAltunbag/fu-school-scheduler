from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.course import Course
from app.models.schedule import Schedule, ScheduleEntry


def _entry_options():
    return selectinload(Schedule.entries).options(
        joinedload(ScheduleEntry.time_slot),
        joinedload(ScheduleEntry.course).options(
            joinedload(Course.subject),
            joinedload(Course.class_group),
            joinedload(Course.teacher),
        ),
    )


def save(db: Session, schedule: Schedule) -> Schedule:
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return db.query(Schedule).options(_entry_options()).filter(Schedule.id == schedule.id).first()  # type: ignore[return-value]


def get_latest(db: Session) -> Schedule | None:
    return (
        db.query(Schedule)
        .options(_entry_options())
        .order_by(Schedule.generated_at.desc())
        .first()
    )
