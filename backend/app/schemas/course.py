from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.class_group import ClassGroupRead
from app.schemas.subject import SubjectRead
from app.schemas.teacher import TeacherRead


class CourseCreate(BaseModel):
    subject_id: UUID
    class_group_id: UUID
    teacher_id: UUID
    weekly_hours: int = Field(ge=1)


class CourseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject: SubjectRead
    class_group: ClassGroupRead
    teacher: TeacherRead
    weekly_hours: int
