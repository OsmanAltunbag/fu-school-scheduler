from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.time_slot import TimeSlotRead


class TeacherCreate(BaseModel):
    name: str
    available_slot_ids: list[UUID]


class TeacherRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    available_slots: list[TimeSlotRead]
