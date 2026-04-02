from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.orm_models import Email, Task, Attachment
from models.schemas import PriorityEnum
from services.ai_service import process_email
from datetime import datetime

async def run_email_agent(sender: str, subject: str, body: str, db: AsyncSession, attachments: list = None, timezone: str = None):
    ai_result = process_email(sender, subject, body)

    if not ai_result.get("is_actionable", False) or not ai_result.get("tasks"):
        return {
            "email_id": None,
            "summary": "Not actionable — skipped",
            "tasks_created": 0
        }

    email_record = Email(
        sender=sender,
        subject=subject,
        body=body,
        processed=False,
        meet_link=ai_result.get("meet_link"),
        sender_timezone=timezone
    )
    db.add(email_record)
    await db.commit()
    await db.refresh(email_record)

    if attachments:
        for att in attachments:
            attachment = Attachment(
                email_id=email_record.id,
                filename=att["filename"],
                content_type=att["content_type"],
                file_data=att["file_data"],
            )
            db.add(attachment)
        await db.commit()

    tasks_created = []

    for task_data in ai_result.get("tasks", []):
        title = task_data.get("title", "").strip()

        existing = await db.execute(
            select(Task).where(
                Task.title == title,
                Task.email.has(sender=sender)
            )
        )
        if existing.scalars().first():
            continue

        priority_raw = task_data.get("priority", "medium").lower()
        if priority_raw not in ["high", "medium", "low"]:
            priority_raw = "medium"

        requested_dt = None
        raw_dt = ai_result.get("requested_datetime")
        if raw_dt:
            try:
                requested_dt = datetime.fromisoformat(raw_dt)
            except Exception:
                requested_dt = None

        task = Task(
            email_id=email_record.id,
            title=title,
            description=task_data.get("description", ""),
            priority=PriorityEnum(priority_raw),
            estimated_minutes=task_data.get("estimated_minutes", 30),
            task_type=task_data.get("task_type", "other"),
            requested_datetime=requested_dt,
            is_recurring=task_data.get("is_recurring", False),
            recurrence_pattern=task_data.get("recurrence_pattern", None)
        )
        db.add(task)
        tasks_created.append(task)

    email_record.processed = True
    await db.commit()

    for task in tasks_created:
        await db.refresh(task)

    return {
        "email_id": email_record.id,
        "summary": ai_result.get("summary", ""),
        "tasks_created": len(tasks_created)
    }