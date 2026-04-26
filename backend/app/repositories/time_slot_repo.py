from sqlalchemy.orm import Session

from app.models.time_slot import TimeSlot


def get_all(db: Session) -> list[TimeSlot]:
    return db.query(TimeSlot).order_by(TimeSlot.day, TimeSlot.period).all()


def get_by_ids(db: Session, ids: list[str]) -> list[TimeSlot]:
    return db.query(TimeSlot).filter(TimeSlot.id.in_(ids)).all()
