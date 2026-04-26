from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class SlotInfo:
    id: UUID
    day: str
    period: int


@dataclass
class TeacherInfo:
    id: UUID
    name: str
    available_slot_ids: set[UUID]


@dataclass
class ClassGroupInfo:
    id: UUID
    name: str


@dataclass
class CourseInfo:
    id: UUID
    teacher_id: UUID
    class_group_id: UUID
    weekly_hours: int


@dataclass
class SchedulingInput:
    courses: list[CourseInfo]
    slots: list[SlotInfo]
    teachers: list[TeacherInfo]
    class_groups: list[ClassGroupInfo]


@dataclass
class AssignedEntry:
    course_id: UUID
    slot_id: UUID


@dataclass
class SchedulingResult:
    success: bool
    entries: list[AssignedEntry] = field(default_factory=list)
    infeasibility_type: str | None = None
    human_message: str | None = None
    conflicts: list[dict] | None = None


class IScheduler(ABC):
    @abstractmethod
    def solve(self, input: SchedulingInput) -> SchedulingResult: ...
