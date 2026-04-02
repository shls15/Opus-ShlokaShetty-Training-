from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.database import engine, Base
from routes import emails, tasks, schedules, auth, settings
from services.poller_service import start_scheduler, stop_scheduler
from services.reminder_service import send_pending_reminders
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging
scheduler = AsyncIOScheduler()
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AI Executive Secretary")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(emails.router, prefix="/emails", tags=["Emails"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(schedules.router, prefix="/schedules", tags=["Schedules"])
app.include_router(settings.router, prefix="/settings", tags=["Settings"])

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    start_scheduler()
    scheduler.add_job(send_pending_reminders, "interval", minutes=30, id="reminder_job", replace_existing=True)
    scheduler.start()

@app.on_event("shutdown")
async def shutdown():
    stop_scheduler()
    scheduler.shutdown()

@app.get("/")
async def root():
    return {"message": "AI Executive Secretary is running"}