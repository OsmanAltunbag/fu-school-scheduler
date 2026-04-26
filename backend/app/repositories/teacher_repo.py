from sqlalchemy.orm import Session

from app.models.teacher import Teacher
from app.models.time_slot import TimeSlot


def get_all(db: Session) -> list[Teacher]:
    return db.query(Teacher).all()


def get_by_id(db: Session, teacher_id: str) -> Teacher | None:
    return db.get(Teacher, teacher_id)


def create(db: Session, name: str, slots: list[TimeSlot]) -> Teacher:
    teacher = Teacher(name=name, available_slots=slots)
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


def update(db: Session, teacher: Teacher, name: str, slots: list[TimeSlot]) -> Teacher:
    teacher.name = name
    teacher.available_slots = slots
    db.commit()
    db.refresh(teacher)
    return teacher


def delete(db: Session, teacher: Teacher) -> None:
    db.delete(teacher)
    db.commit()
