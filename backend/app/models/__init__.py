from app.models.class_group import ClassGroup
from app.models.course import Course
from app.models.schedule import Schedule, ScheduleEntry, ScheduleStatus
from app.models.subject import Subject
from app.models.teacher import Teacher, teacher_availability
from app.models.time_slot import DayOfWeek, TimeSlot

__all__ = [
    "ClassGroup",
    "Course",
    "DayOfWeek",
    "Schedule",
    "ScheduleEntry",
    "ScheduleStatus",
    "Subject",
    "Teacher",
    "TimeSlot",
    "teacher_availability",
]
