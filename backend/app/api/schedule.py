from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.repositories import class_group_repo, schedule_repo, teacher_repo
from app.schemas.schedule import ConflictReport, ScheduleEntryRead, ScheduleRead
from app.services import schedule_service

router = APIRouter()


@router.post("/generate", response_model=ScheduleRead)
def generate_schedule(db: Session = Depends(get_db)):
    schedule, conflict = schedule_service.generate(db)
    if conflict is not None:
        raise HTTPException(status_code=422, detail=conflict)
    return schedule


@router.get("/latest", response_model=ScheduleRead)
def get_latest(db: Session = Depends(get_db)):
    schedule = schedule_repo.get_latest(db)
    if schedule is None:
        raise HTTPException(status_code=404, detail="No schedule has been generated yet.")
    return schedule


@router.get("/by-class/{class_id}", response_model=list[ScheduleEntryRead])
def get_by_class(class_id: str, db: Session = Depends(get_db)):
    cg = class_group_repo.get_by_id(db, class_id)
    if cg is None:
        raise HTTPException(status_code=404, detail="Class not found.")
    if schedule_repo.get_latest(db) is None:
        raise HTTPException(status_code=404, detail="No schedule has been generated yet.")
    return schedule_repo.get_entries_by_class(db, class_id)


@router.get("/by-teacher/{teacher_id}", response_model=list[ScheduleEntryRead])
def get_by_teacher(teacher_id: str, db: Session = Depends(get_db)):
    teacher = teacher_repo.get_by_id(db, teacher_id)
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found.")
    if schedule_repo.get_latest(db) is None:
        raise HTTPException(status_code=404, detail="No schedule has been generated yet.")
    return schedule_repo.get_entries_by_teacher(db, teacher_id)
