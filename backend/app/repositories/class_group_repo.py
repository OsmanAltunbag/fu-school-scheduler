from sqlalchemy.orm import Session

from app.models.class_group import ClassGroup


def get_all(db: Session) -> list[ClassGroup]:
    return db.query(ClassGroup).all()


def get_by_id(db: Session, class_group_id: str) -> ClassGroup | None:
    return db.get(ClassGroup, class_group_id)


def create(db: Session, name: str, grade_level: int) -> ClassGroup:
    cg = ClassGroup(name=name, grade_level=grade_level)
    db.add(cg)
    db.commit()
    db.refresh(cg)
    return cg


def update(db: Session, cg: ClassGroup, name: str, grade_level: int) -> ClassGroup:
    cg.name = name
    cg.grade_level = grade_level
    db.commit()
    db.refresh(cg)
    return cg


def delete(db: Session, cg: ClassGroup) -> None:
    db.delete(cg)
    db.commit()
