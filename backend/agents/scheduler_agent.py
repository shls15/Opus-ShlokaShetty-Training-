from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.orm_models import Task, Schedule, Email
from services.calendar_service import find_free_slot
from services.google_calendar_service import create_calendar_event
from datetime import datetime, timedelta

async def run_scheduler_agent(task_id: int, db: AsyncSession):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalars().first()

    if not task:
        return {"error": "Task not found"}

    if str(task.status).lower() != "approved" and task.status != "approved":
        return {"error": "Task is not approved yet"}

    existing = await db.execute(select(Schedule).where(Schedule.task_id == task_id))
    existing_schedule = existing.scalars().first()
    if existing_schedule:
        return {
            "message": "Already scheduled",
            "start_time": existing_schedule.start_time,
            "end_time": existing_schedule.end_time,
            "meet_link": existing_schedule.meet_link,
        }

    email_result = await db.execute(select(Email).where(Email.id == task.email_id))
    email_record = email_result.scalars().first()

    attendee_email = None
    meet_link_from_email = None
    if email_record:
        sender = email_record.sender
        if "<" in sender:
            attendee_email = sender.split("<")[1].replace(">", "").strip()
        else:
            attendee_email = sender.strip()
        meet_link_from_email = getattr(email_record, 'meet_link', None)

    if task.requested_datetime:
        start_time = task.requested_datetime
        end_time = start_time + timedelta(minutes=task.estimated_minutes)
    else:
        start_time, end_time = await find_free_slot(task.estimated_minutes, db)

    if not task.requested_datetime:
        conflict_schedules = await db.execute(
            select(Schedule).where(
                Schedule.start_time < end_time,
                Schedule.end_time > start_time
            )
        )
        conflicts = conflict_schedules.scalars().all()
        
        for conflict in conflicts:
            conflict_task_result = await db.execute(select(Task).where(Task.id == conflict.task_id))
            conflict_task = conflict_task_result.scalars().first()
            
            if not conflict_task:
                continue

            priority_order = {"high": 3, "medium": 2, "low": 1}
            task_prio_str = str(task.priority).split('.')[-1].lower()
            conf_prio_str = str(conflict_task.priority).split('.')[-1].lower()
            
            current_priority = priority_order.get(task_prio_str, 2)
            conflict_priority = priority_order.get(conf_prio_str, 2)

            if current_priority > conflict_priority:
                old_start = conflict.start_time
                await db.delete(conflict)
                await db.commit() 

                new_start, new_end = await find_free_slot(conflict_task.estimated_minutes, db)
                
                new_schedule = Schedule(
                    task_id=conflict_task.id,
                    start_time=new_start,
                    end_time=new_end,
                    is_rescheduled=True
                )
                db.add(new_schedule)
                await db.commit()

    google_event = None
    meet_link = meet_link_from_email
    html_link = None
    google_event_id = None

    try:
        google_event = create_calendar_event(
            title=task.title,
            description=task.description,
            start_time=start_time,
            end_time=end_time,
            attendee_email=attendee_email,
            meet_link=meet_link_from_email,
        )
        if not meet_link:
            meet_link = google_event.get("meet_link")
        html_link = google_event.get("html_link")
        google_event_id = google_event.get("event_id")
    except Exception as e:
        print(f"Google Calendar error: {e}")

    schedule = Schedule(
        task_id=task.id,
        start_time=start_time,
        end_time=end_time,
        google_event_id=google_event_id,
        meet_link=meet_link,
        html_link=html_link,
        is_rescheduled=False
    )

    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)

    return {
        "task_id": task_id,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "meet_link": meet_link,
        "html_link": html_link,
        "scheduled": True
    }

async def suggest_alternate_slots(task_id: int, db: AsyncSession):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalars().first()
    if not task:
        return

    from models.orm_models import Email
    email_result = await db.execute(select(Email).where(Email.id == task.email_id))
    email_record = email_result.scalars().first()
    if not email_record:
        return

    recipient = email_record.sender
    if "<" in recipient:
        recipient = recipient.split("<")[1].replace(">", "").strip()

    slots = []
    search_start = datetime.utcnow()
    for i in range(3):
        s, e = await find_free_slot(task.estimated_minutes, db)
        slots.append((s, e))
        dummy_schedule = Schedule(task_id=0, start_time=s, end_time=e)

    slot_text = "\n".join([
        f"  Option {i+1}: {s.strftime('%A, %B %d at %I:%M %p')} - {e.strftime('%I:%M %p')} UTC"
        for i, (s, e) in enumerate(slots)
    ])

    import smtplib, os
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Re: {email_record.subject} — Alternate Times Available"
    msg["From"] = os.getenv("SMTP_USER")
    msg["To"] = recipient
    body = f"""Hello,

Your request '{task.title}' could not be accommodated at the originally requested time.

Here are the next available time slots:

{slot_text}

Please reply with your preferred option and we will confirm.

Best regards,
Executive Secretary"""
    msg.attach(MIMEText(body, "plain"))
    try:
        with smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT"))) as server:
            server.ehlo()
            server.starttls()
            server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
            server.sendmail(os.getenv("SMTP_USER"), recipient, msg.as_string())
        print(f"Alternate slots sent to {recipient}")
    except Exception as e:
        print(f"Alternate slot email error: {e}")