from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.database import get_db
from models.orm_models import Schedule
from models.schemas import ScheduleOut
from agents.scheduler_agent import run_scheduler_agent
from typing import List

router = APIRouter()

@router.get("/", response_model=List[ScheduleOut])
async def get_all_schedules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Schedule).order_by(Schedule.start_time.asc()))
    return result.scalars().all()

@router.get("/{schedule_id}", response_model=ScheduleOut)
async def get_schedule(schedule_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Schedule).where(Schedule.id == schedule_id))
    schedule = result.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule

@router.get("/task/{task_id}", response_model=ScheduleOut)
async def get_schedule_by_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Schedule).where(Schedule.task_id == task_id))
    schedule = result.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="No schedule found for this task")
    return schedule

@router.post("/task/{task_id}", response_model=ScheduleOut)
async def schedule_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await run_scheduler_agent(task_id, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    scheduled = await db.execute(select(Schedule).where(Schedule.task_id == task_id))
    return scheduled.scalars().first()

@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Schedule).where(Schedule.id == schedule_id))
    schedule = result.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    await db.delete(schedule)
    await db.commit()
    return {"message": "Schedule deleted"}

@router.patch("/task/{task_id}/reschedule", response_model=ScheduleOut)
async def reschedule_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Schedule).where(Schedule.task_id == task_id))
    schedule = result.scalars().first()

    if not schedule:
        raise HTTPException(status_code=404, detail="No schedule found for this task")

    await db.delete(schedule)
    await db.commit()

    new_result = await run_scheduler_agent(task_id, db)
    if "error" in new_result:
        raise HTTPException(status_code=400, detail=new_result["error"])

    updated = await db.execute(select(Schedule).where(Schedule.task_id == task_id))
    new_schedule = updated.scalars().first()
    new_schedule.is_rescheduled = True
    await db.commit()
    await db.refresh(new_schedule)
    return new_schedule