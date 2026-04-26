from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.schedule import ScheduleStatus
from app.schemas.course import CourseRead
from app.schemas.time_slot import TimeSlotRead


class ScheduleEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    course: CourseRead
    time_slot: TimeSlotRead


class ScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    generated_at: datetime
    status: ScheduleStatus
    entries: list[ScheduleEntryRead]


class ConflictDetail(BaseModel):
    entity: str
    description: str
    suggestion: str | None = None


class ConflictReport(BaseModel):
    type: str
    human_message: str
    conflicts: list[ConflictDetail]
