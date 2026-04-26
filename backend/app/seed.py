import uuid

from app.db import SessionLocal
from app.models.time_slot import DayOfWeek, TimeSlot

DAYS = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
]


def seed_time_slots() -> None:
    db = SessionLocal()
    try:
        existing = db.query(TimeSlot).count()
        if existing >= 40:
            print(f"Time slots already seeded ({existing} records). Skipping.")
            return

        slots = []
        for day in DAYS:
            for period in range(1, 9):
                slot_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{day.value}-{period}"))
                slots.append(TimeSlot(id=slot_id, day=day, period=period))

        db.add_all(slots)
        db.commit()
        print(f"Seeded {len(slots)} time slots.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_time_slots()
