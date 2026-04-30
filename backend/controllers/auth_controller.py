import os
import random
import secrets
import smtplib
from email.mime.text import MIMEText

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.models.db_model import OTPStore, SessionToken
import requests


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def send_otp_email(email: str, code: str):
    api_key = os.getenv("BREVO_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="Servicio de correo no configurado")
        

    try:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": api_key,
                "Content-Type": "application/json"
            },
            json={
                "sender": {"name": "Sistema Estudiantes", "email": "alecorro123@outlook.com"},
                "to": [{"email": email}],
                "subject": "Código de verificación - Sistema Estudiantes",
                "textContent": f"Tu código de verificación es: {code}\n\nEste código se usa solo una vez."
            }
        )
        response.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enviando email: {str(e)}")

class AuthController:
    @staticmethod
    def request_otp(email: str, db: Session) -> dict:
        code = generate_otp()

        # Invalidar OTPs anteriores no usados
        db.query(OTPStore).filter(OTPStore.email == email, OTPStore.used == 0).update(
            {OTPStore.used: 1},
            synchronize_session=False,
        )

        otp_entry = OTPStore(email=email, code=code, used=0)
        db.add(otp_entry)
        db.commit()

        send_otp_email(email, code)

        return {"message": "Código enviado a tu correo"}
    @staticmethod
    def verify_otp(email: str, code: str, db: Session) -> dict:
        otp_entry = (
            db.query(OTPStore)
            .filter(OTPStore.email == email, OTPStore.code == code, OTPStore.used == 0)
            .order_by(OTPStore.id.desc())
            .first()
        )

        if not otp_entry:
            raise HTTPException(status_code=400, detail="Código inválido o ya utilizado")

        otp_entry.used = 1

        db.query(SessionToken).filter(SessionToken.email == email, SessionToken.active == 1).update(
            {SessionToken.active: 0},
            synchronize_session=False,
        )

        token = secrets.token_urlsafe(32)
        session = SessionToken(email=email, token=token, active=1)
        db.add(session)
        db.commit()

        return {"token": token, "message": "Autenticación exitosa", "email": email}

    @staticmethod
    def get_session(session: SessionToken) -> dict:
        return {"email": session.email, "message": "Sesión activa"}

    @staticmethod
    def logout(session: SessionToken, db: Session) -> dict:
        session.active = 0
        db.commit()
        return {"message": "Sesión cerrada"}
