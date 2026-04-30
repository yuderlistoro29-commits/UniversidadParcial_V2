from pydantic import BaseModel, Field

class Student(BaseModel):
    name: str = Field(..., min_length=2)
    lastname: str = Field(..., min_length=2) 
    age: int = Field(..., gt=0)
    grade: float = Field(..., ge=0, le=5)

class StudentResponse(Student):
    id: int  

    class Config:
        from_attributes = True

class EmailRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    code: str
