from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.orm_models import Schedule, UserSettings
import holidays

async def get_user_settings(db: AsyncSession, user_id: int = None):
    if user_id:
        result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
        settings = result.scalars().first()
        if settings:
            return settings
    result = await db.execute(select(UserSettings))
    settings = result.scalars().first()
    if settings:
        return settings
    class DefaultSettings:
        work_start_hour = 9
        work_end_hour = 18
        work_days = "1,2,3,4,5"
        lunch_start = None
        lunch_end = None
        slot_interval_minutes = 30
    return DefaultSettings()

def is_working_time(dt: datetime, settings, country: str = "IN") -> bool:
    work_days = [int(d) for d in settings.work_days.split(",")]
    if dt.isoweekday() not in work_days:
        return False
    if dt.hour < settings.work_start_hour or dt.hour >= settings.work_end_hour:
        return False
    if settings.lunch_start and settings.lunch_end:
        if settings.lunch_start <= dt.hour < settings.lunch_end:
            return False
    country_holidays = holidays.country_holidays(country, years=dt.year)
    if dt.date() in country_holidays:
        return False
    return True

def next_working_slot(from_dt: datetime, settings) -> datetime:
    dt = from_dt.replace(second=0, microsecond=0)
    interval = settings.slot_interval_minutes
    remainder = dt.minute % interval
    if remainder != 0:
        dt = dt + timedelta(minutes=(interval - remainder))

    attempts = 0
    while not is_working_time(dt, settings) and attempts < 500:
        work_days = [int(d) for d in settings.work_days.split(",")]
        if dt.isoweekday() not in work_days:
            dt = dt.replace(hour=settings.work_start_hour, minute=0) + timedelta(days=1)
        elif dt.hour < settings.work_start_hour:
            dt = dt.replace(hour=settings.work_start_hour, minute=0)
        elif dt.hour >= settings.work_end_hour:
            dt = dt.replace(hour=settings.work_start_hour, minute=0) + timedelta(days=1)
        elif settings.lunch_start and settings.lunch_end:
            if settings.lunch_start <= dt.hour < settings.lunch_end:
                dt = dt.replace(hour=settings.lunch_end, minute=0)
        attempts += 1
    return dt

async def find_free_slot(estimated_minutes: int, db: AsyncSession, user_id: int = None) -> tuple:
    settings = await get_user_settings(db, user_id)
    start_search = next_working_slot(datetime.utcnow(), settings)
    duration = timedelta(minutes=estimated_minutes)
    buffer = timedelta(minutes=getattr(settings, 'buffer_minutes', 10))

    result = await db.execute(select(Schedule))
    existing_schedules = result.scalars().all()

    candidate_start = start_search
    attempts = 0

    while attempts < 200:
        candidate_end = candidate_start + duration
        if not is_working_time(candidate_start, settings) or not is_working_time(candidate_end - timedelta(minutes=1), settings):
            candidate_start = next_working_slot(candidate_end, settings)
            attempts += 1
            continue

        conflict = False
        for schedule in existing_schedules:
            buffered_start = schedule.start_time - buffer
            buffered_end = schedule.end_time + buffer
            if candidate_start < buffered_end and candidate_end > buffered_start:
                conflict = True
                candidate_start = next_working_slot(schedule.end_time + buffer, settings)
                break

        if not conflict:
            return candidate_start, candidate_end
        attempts += 1

    return candidate_start, candidate_start + duration