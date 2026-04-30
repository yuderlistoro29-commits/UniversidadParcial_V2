from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.models.db_model import Students as StudentDB
from backend.models.student_model import Student


class StudentController:
    @staticmethod
    def get_all(db: Session) -> list:
        return db.query(StudentDB).order_by(StudentDB.id.asc()).all()

    @staticmethod
    def get_by_id(student_id: int, db: Session) -> dict:
        student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        return student

    @staticmethod
    def create(student: Student, db: Session) -> dict:
        new_student = StudentDB(**student.model_dump())
        db.add(new_student)
        db.commit()
        db.refresh(new_student)
        return new_student

    @staticmethod
    def update(student_id: int, update_data: Student, db: Session) -> dict:
        student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")

        for field, value in update_data.model_dump().items():
            setattr(student, field, value)

        db.commit()
        db.refresh(student)
        return student

    @staticmethod
    def delete(student_id: int, db: Session) -> dict:
        student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")

        db.delete(student)
        db.commit()
        return {"message": f"Estudiante {student_id} eliminado"}
