from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.controllers.auth_controller import AuthController
from backend.dependencies import require_session
from backend.database import get_db
from backend.models.db_model import SessionToken
from backend.models.student_model import EmailRequest, OTPVerify

router = APIRouter(prefix="/api/auth")


@router.post("/request-otp")
def request_otp(body: EmailRequest, db: Session = Depends(get_db)):
    return AuthController.request_otp(body.email, db)


@router.post("/verify-otp")
def verify_otp(body: OTPVerify, db: Session = Depends(get_db)):
    return AuthController.verify_otp(body.email, body.code, db)


@router.get("/session")
def get_session(session: SessionToken = Depends(require_session)):
    return AuthController.get_session(session)


@router.post("/logout")
def logout(session: SessionToken = Depends(require_session), db: Session = Depends(get_db)):
    return AuthController.logout(session, db)
