from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from AI_Executive_Secretary.backend.models.orm_models import Task, Email, Notification
from AI_Executive_Secretary.backend.services.notification_service import send_completion_email
from datetime import datetime

async def run_notification_agent(task_id: int, db: AsyncSession):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalars().first()

    if not task:
        return {"error": "Task not found"}

    if task.status.value != "completed":
        return {"error": "Task is not completed yet"}

    email_result = await db.execute(select(Email).where(Email.id == task.email_id))
    email_record = email_result.scalars().first()

    if not email_record:
        return {"error": "Original email not found"}

    existing = await db.execute(
        select(Notification).where(
            Notification.task_id == task_id,
            Notification.type == "completion"
        )
    )
    if existing.scalars().first():
        return {"message": "Notification already sent"}

    recipient = email_record.sender
    if "<" in recipient:
        recipient = recipient.split("<")[1].replace(">", "").strip()

    success = send_completion_email(recipient, task.title)

    notification = Notification(
        task_id=task.id,
        recipient_email=recipient,
        sent_at=datetime.utcnow() if success else None,
        type="completion"
    )

    db.add(notification)
    await db.commit()
    await db.refresh(notification)

    return {
        "task_id": task_id,
        "recipient": recipient,
        "sent": success
    }