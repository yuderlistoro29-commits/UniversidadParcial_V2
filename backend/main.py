from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.database import Base, engine
from backend.routes import auth, students


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Estudiantes")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

_NO_CACHE = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}


@app.get("/", include_in_schema=False)
@app.get("/index.html", include_in_schema=False)
def home():
    return FileResponse(FRONTEND_DIR / "index.html", headers=_NO_CACHE)


@app.get("/students", include_in_schema=False)
@app.get("/students.html", include_in_schema=False)
def students_page():
    return FileResponse(FRONTEND_DIR / "students.html", headers=_NO_CACHE)


app.include_router(auth.router)
app.include_router(students.router)
