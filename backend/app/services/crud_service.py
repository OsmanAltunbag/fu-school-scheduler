from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.class_group import ClassGroup
from app.models.course import Course
from app.models.subject import Subject
from app.models.teacher import Teacher
from app.repositories import (
    class_group_repo,
    course_repo,
    subject_repo,
    teacher_repo,
    time_slot_repo,
)
from app.schemas.class_group import ClassGroupCreate
from app.schemas.course import CourseCreate
from app.schemas.subject import SubjectCreate
from app.schemas.teacher import TeacherCreate

# ---------------------------------------------------------------------------
# Teachers
# ---------------------------------------------------------------------------


def get_teachers(db: Session) -> list[Teacher]:
    return teacher_repo.get_all(db)


def get_teacher(db: Session, teacher_id: str) -> Teacher:
    teacher = teacher_repo.get_by_id(db, teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")
    return teacher


def create_teacher(db: Session, data: TeacherCreate) -> Teacher:
    slot_ids = [str(sid) for sid in data.available_slot_ids]
    slots = time_slot_repo.get_by_ids(db, slot_ids)
    if len(slots) != len(slot_ids):
        raise HTTPException(status_code=422, detail="One or more slot IDs are invalid.")
    return teacher_repo.create(db, data.name, slots)


def update_teacher(db: Session, teacher_id: str, data: TeacherCreate) -> Teacher:
    teacher = get_teacher(db, teacher_id)
    slot_ids = [str(sid) for sid in data.available_slot_ids]
    slots = time_slot_repo.get_by_ids(db, slot_ids)
    if len(slots) != len(slot_ids):
        raise HTTPException(status_code=422, detail="One or more slot IDs are invalid.")
    return teacher_repo.update(db, teacher, data.name, slots)


def delete_teacher(db: Session, teacher_id: str) -> None:
    teacher = get_teacher(db, teacher_id)
    if teacher.courses:
        raise HTTPException(
            status_code=409,
            detail="Teacher is assigned to one or more courses and cannot be deleted.",
        )
    teacher_repo.delete(db, teacher)


# ---------------------------------------------------------------------------
# Class groups
# ---------------------------------------------------------------------------


def get_class_groups(db: Session) -> list[ClassGroup]:
    return class_group_repo.get_all(db)


def get_class_group(db: Session, class_group_id: str) -> ClassGroup:
    cg = class_group_repo.get_by_id(db, class_group_id)
    if not cg:
        raise HTTPException(status_code=404, detail="Class group not found.")
    return cg


def create_class_group(db: Session, data: ClassGroupCreate) -> ClassGroup:
    return class_group_repo.create(db, data.name, data.grade_level)


def update_class_group(db: Session, class_group_id: str, data: ClassGroupCreate) -> ClassGroup:
    cg = get_class_group(db, class_group_id)
    return class_group_repo.update(db, cg, data.name, data.grade_level)


def delete_class_group(db: Session, class_group_id: str) -> None:
    cg = get_class_group(db, class_group_id)
    if cg.courses:
        raise HTTPException(
            status_code=409,
            detail="Class group is assigned to one or more courses and cannot be deleted.",
        )
    class_group_repo.delete(db, cg)


# ---------------------------------------------------------------------------
# Subjects
# ---------------------------------------------------------------------------


def get_subjects(db: Session) -> list[Subject]:
    return subject_repo.get_all(db)


def get_subject(db: Session, subject_id: str) -> Subject:
    subject = subject_repo.get_by_id(db, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    return subject


def create_subject(db: Session, data: SubjectCreate) -> Subject:
    if subject_repo.get_by_name(db, data.name):
        raise HTTPException(status_code=409, detail=f"Subject '{data.name}' already exists.")
    return subject_repo.create(db, data.name)


def update_subject(db: Session, subject_id: str, data: SubjectCreate) -> Subject:
    subject = get_subject(db, subject_id)
    existing = subject_repo.get_by_name(db, data.name)
    if existing and existing.id != subject_id:
        raise HTTPException(status_code=409, detail=f"Subject '{data.name}' already exists.")
    return subject_repo.update(db, subject, data.name)


def delete_subject(db: Session, subject_id: str) -> None:
    subject = get_subject(db, subject_id)
    if subject.courses:
        raise HTTPException(
            status_code=409,
            detail="Subject is assigned to one or more courses and cannot be deleted.",
        )
    subject_repo.delete(db, subject)


# ---------------------------------------------------------------------------
# Courses
# ---------------------------------------------------------------------------


def get_courses(db: Session) -> list[Course]:
    return course_repo.get_all(db)


def get_course(db: Session, course_id: str) -> Course:
    course = course_repo.get_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    return course


def create_course(db: Session, data: CourseCreate) -> Course:
    teacher = get_teacher(db, str(data.teacher_id))
    cg = get_class_group(db, str(data.class_group_id))
    subject = get_subject(db, str(data.subject_id))

    # FR-006: weekly_hours must not exceed teacher's available slots
    if data.weekly_hours > len(teacher.available_slots):
        raise HTTPException(
            status_code=422,
            detail=(
                f"Teacher {teacher.name} has {len(teacher.available_slots)} available slots "
                f"but course requires {data.weekly_hours} weekly hours."
            ),
        )

    # FR-007: (subject, class_group) must be unique
    if course_repo.get_by_subject_class(db, str(data.subject_id), str(data.class_group_id)):
        raise HTTPException(
            status_code=409,
            detail=f"Class {cg.name} already has a course for {subject.name}.",
        )

    return course_repo.create(
        db,
        subject_id=str(data.subject_id),
        class_group_id=str(data.class_group_id),
        teacher_id=str(data.teacher_id),
        weekly_hours=data.weekly_hours,
    )


def delete_course(db: Session, course_id: str) -> None:
    course = get_course(db, course_id)
    course_repo.delete(db, course)
