from sqlalchemy.orm import Session

from app.models.subject import Subject


def get_all(db: Session) -> list[Subject]:
    return db.query(Subject).all()


def get_by_id(db: Session, subject_id: str) -> Subject | None:
    return db.get(Subject, subject_id)


def get_by_name(db: Session, name: str) -> Subject | None:
    return db.query(Subject).filter(Subject.name == name).first()


def create(db: Session, name: str) -> Subject:
    subject = Subject(name=name)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def update(db: Session, subject: Subject, name: str) -> Subject:
    subject.name = name
    db.commit()
    db.refresh(subject)
    return subject


def delete(db: Session, subject: Subject) -> None:
    db.delete(subject)
    db.commit()
