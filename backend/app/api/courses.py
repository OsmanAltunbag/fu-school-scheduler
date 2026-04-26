from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.course import CourseCreate, CourseRead
from app.services import crud_service

router = APIRouter()


@router.get("", response_model=list[CourseRead])
def list_courses(db: Session = Depends(get_db)):
    return crud_service.get_courses(db)


@router.post("", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(data: CourseCreate, db: Session = Depends(get_db)):
    return crud_service.create_course(db, data)


@router.get("/{course_id}", response_model=CourseRead)
def get_course(course_id: str, db: Session = Depends(get_db)):
    return crud_service.get_course(db, course_id)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: str, db: Session = Depends(get_db)):
    crud_service.delete_course(db, course_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
