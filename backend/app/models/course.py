import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (
        UniqueConstraint("subject_id", "class_group_id", name="uq_course_subject_class"),
        CheckConstraint("weekly_hours >= 1", name="ck_course_weekly_hours"),
    )

    id: Mapped[str] = mapped_column(primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id: Mapped[str] = mapped_column(String, ForeignKey("subjects.id"), nullable=False)
    class_group_id: Mapped[str] = mapped_column(
        String, ForeignKey("class_groups.id"), nullable=False
    )
    teacher_id: Mapped[str] = mapped_column(String, ForeignKey("teachers.id"), nullable=False)
    weekly_hours: Mapped[int] = mapped_column(Integer, nullable=False)

    subject: Mapped["Subject"] = relationship("Subject", back_populates="courses")  # noqa: F821
    class_group: Mapped["ClassGroup"] = relationship(  # noqa: F821
        "ClassGroup", back_populates="courses"
    )
    teacher: Mapped["Teacher"] = relationship("Teacher", back_populates="courses")  # noqa: F821
