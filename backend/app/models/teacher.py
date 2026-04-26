import uuid

from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

teacher_availability = Table(
    "teacher_availability",
    Base.metadata,
    Column("teacher_id", String, ForeignKey("teachers.id"), primary_key=True),
    Column("time_slot_id", String, ForeignKey("time_slots.id"), primary_key=True),
)


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[str] = mapped_column(primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    available_slots: Mapped[list["TimeSlot"]] = relationship(  # noqa: F821
        "TimeSlot",
        secondary=teacher_availability,
        lazy="selectin",
    )
    courses: Mapped[list["Course"]] = relationship("Course", back_populates="teacher")  # noqa: F821
