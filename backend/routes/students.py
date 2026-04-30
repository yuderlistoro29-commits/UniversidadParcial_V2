from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.controllers.student_controller import StudentController
from backend.dependencies import require_session
from backend.database import get_db
from backend.models.student_model import Student

router = APIRouter(prefix="/api/students", dependencies=[Depends(require_session)])


@router.get("/")
def get_students(db: Session = Depends(get_db)):
    return StudentController.get_all(db)


@router.get("/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    return StudentController.get_by_id(student_id, db)


@router.post("/")
def create_student(student: Student, db: Session = Depends(get_db)):
    return StudentController.create(student, db)


@router.put("/{student_id}")
def update_student(student_id: int, update_data: Student, db: Session = Depends(get_db)):
    return StudentController.update(student_id, update_data, db)


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    return StudentController.delete(student_id, db)
