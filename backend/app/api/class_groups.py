from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.class_group import ClassGroupCreate, ClassGroupRead
from app.services import crud_service

router = APIRouter()


@router.get("/", response_model=list[ClassGroupRead])
def list_class_groups(db: Session = Depends(get_db)):
    return crud_service.get_class_groups(db)


@router.post("/", response_model=ClassGroupRead, status_code=status.HTTP_201_CREATED)
def create_class_group(data: ClassGroupCreate, db: Session = Depends(get_db)):
    return crud_service.create_class_group(db, data)


@router.get("/{class_group_id}", response_model=ClassGroupRead)
def get_class_group(class_group_id: str, db: Session = Depends(get_db)):
    return crud_service.get_class_group(db, class_group_id)


@router.put("/{class_group_id}", response_model=ClassGroupRead)
def update_class_group(
    class_group_id: str, data: ClassGroupCreate, db: Session = Depends(get_db)
):
    return crud_service.update_class_group(db, class_group_id, data)


@router.delete("/{class_group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class_group(class_group_id: str, db: Session = Depends(get_db)):
    crud_service.delete_class_group(db, class_group_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
