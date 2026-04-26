from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.teacher import TeacherCreate, TeacherRead
from app.services import crud_service

router = APIRouter()


@router.get("", response_model=list[TeacherRead])
def list_teachers(db: Session = Depends(get_db)):
    return crud_service.get_teachers(db)


@router.post("", response_model=TeacherRead, status_code=status.HTTP_201_CREATED)
def create_teacher(data: TeacherCreate, db: Session = Depends(get_db)):
    return crud_service.create_teacher(db, data)


@router.get("/{teacher_id}", response_model=TeacherRead)
def get_teacher(teacher_id: str, db: Session = Depends(get_db)):
    return crud_service.get_teacher(db, teacher_id)


@router.put("/{teacher_id}", response_model=TeacherRead)
def update_teacher(teacher_id: str, data: TeacherCreate, db: Session = Depends(get_db)):
    return crud_service.update_teacher(db, teacher_id, data)


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(teacher_id: str, db: Session = Depends(get_db)):
    crud_service.delete_teacher(db, teacher_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
