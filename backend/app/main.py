from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import class_groups, courses, subjects, teachers, time_slots

app = FastAPI(title="School Scheduler API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(teachers.router, prefix="/api/teachers", tags=["teachers"])
app.include_router(class_groups.router, prefix="/api/classes", tags=["classes"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["subjects"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(time_slots.router, prefix="/api/timeslots", tags=["timeslots"])


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
