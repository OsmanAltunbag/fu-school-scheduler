from pydantic import BaseModel, ConfigDict


class ClassGroupCreate(BaseModel):
    name: str
    grade_level: int


class ClassGroupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    grade_level: int
