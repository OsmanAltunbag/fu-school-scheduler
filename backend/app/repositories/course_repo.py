from sqlalchemy.orm import Session, joinedload

from app.models.course import Course


def _with_relations(query):
    return query.options(
        joinedload(Course.subject),
        joinedload(Course.class_group),
        joinedload(Course.teacher),
    )


def get_all(db: Session) -> list[Course]:
    return _with_relations(db.query(Course)).all()


def get_by_id(db: Session, course_id: str) -> Course | None:
    return _with_relations(db.query(Course)).filter(Course.id == course_id).first()


def get_by_subject_class(
    db: Session, subject_id: str, class_group_id: str
) -> Course | None:
    return (
        db.query(Course)
        .filter(Course.subject_id == subject_id, Course.class_group_id == class_group_id)
        .first()
    )


def create(db: Session, subject_id: str, class_group_id: str, teacher_id: str, weekly_hours: int) -> Course:
    course = Course(
        subject_id=subject_id,
        class_group_id=class_group_id,
        teacher_id=teacher_id,
        weekly_hours=weekly_hours,
    )
    db.add(course)
    db.commit()
    return get_by_id(db, course.id)  # type: ignore[arg-type]


def delete(db: Session, course: Course) -> None:
    db.delete(course)
    db.commit()
