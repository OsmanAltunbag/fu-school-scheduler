from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.repositories import time_slot_repo
from app.schemas.time_slot import TimeSlotRead

router = APIRouter()


@router.get("/", response_model=list[TimeSlotRead])
def list_time_slots(db: Session = Depends(get_db)):
    return time_slot_repo.get_all(db)
