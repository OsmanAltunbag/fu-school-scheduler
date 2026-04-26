from pydantic import BaseModel, ConfigDict

from app.models.time_slot import DayOfWeek


class TimeSlotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    day: DayOfWeek
    period: int
