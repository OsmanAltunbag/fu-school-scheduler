from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.subject import SubjectCreate, SubjectRead
from app.services import crud_service

router = APIRouter()


@router.get("/", response_model=list[SubjectRead])
def list_subjects(db: Session = Depends(get_db)):
    return crud_service.get_subjects(db)


@router.post("/", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db)):
    return crud_service.create_subject(db, data)


@router.get("/{subject_id}", response_model=SubjectRead)
def get_subject(subject_id: str, db: Session = Depends(get_db)):
    return crud_service.get_subject(db, subject_id)


@router.put("/{subject_id}", response_model=SubjectRead)
def update_subject(subject_id: str, data: SubjectCreate, db: Session = Depends(get_db)):
    return crud_service.update_subject(db, subject_id, data)


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: str, db: Session = Depends(get_db)):
    crud_service.delete_subject(db, subject_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
