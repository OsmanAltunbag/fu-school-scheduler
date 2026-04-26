from pydantic import BaseModel, ConfigDict


class SubjectCreate(BaseModel):
    name: str


class SubjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
