import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class ScheduleStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[str] = mapped_column(primary_key=True, default=lambda: str(uuid.uuid4()))
    generated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[ScheduleStatus] = mapped_column(Enum(ScheduleStatus), nullable=False)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    entries: Mapped[list["ScheduleEntry"]] = relationship(
        "ScheduleEntry",
        back_populates="schedule",
        cascade="all, delete-orphan",
    )


class ScheduleEntry(Base):
    __tablename__ = "schedule_entries"
    __table_args__ = (
        UniqueConstraint(
            "schedule_id", "course_id", "time_slot_id", name="uq_entry_schedule_course_slot"
        ),
    )

    id: Mapped[str] = mapped_column(primary_key=True, default=lambda: str(uuid.uuid4()))
    schedule_id: Mapped[str] = mapped_column(
        String, ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(String, ForeignKey("courses.id"), nullable=False)
    time_slot_id: Mapped[str] = mapped_column(
        String, ForeignKey("time_slots.id"), nullable=False
    )

    schedule: Mapped["Schedule"] = relationship("Schedule", back_populates="entries")
    course: Mapped["Course"] = relationship("Course")  # noqa: F821
    time_slot: Mapped["TimeSlot"] = relationship("TimeSlot")  # noqa: F821
