from AI_Executive_Secretary.backend.models.database import AsyncSessionLocal
from AI_Executive_Secretary.backend.models.orm_models import Task, Email
from sqlalchemy import select
from datetime import datetime, timedelta
import smtplib, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

async def send_pending_reminders():
    logger.info("Checking for pending tasks to remind...")
    try:
        async with AsyncSessionLocal() as db:
            cutoff = datetime.utcnow() - timedelta(hours=2)
            result = await db.execute(
                select(Task).where(
                    Task.status == "pending",
                    Task.created_at <= cutoff
                )
            )
            pending_tasks = result.scalars().all()

            if not pending_tasks:
                logger.info("No pending reminders needed.")
                return

            smtp_user = os.getenv("SMTP_USER")
            smtp_pass = os.getenv("SMTP_PASS")
            smtp_host = os.getenv("SMTP_HOST")
            smtp_port = int(os.getenv("SMTP_PORT"))

            for task in pending_tasks:
                try:
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = f"⏰ Reminder: '{task.title}' awaiting your approval"
                    msg["From"] = smtp_user
                    msg["To"] = smtp_user
                    body = f"""Hello,

This is a reminder that the following task has been pending approval for over 2 hours:

Task: {task.title}
Priority: {task.priority}
Description: {task.description}
Created: {task.created_at.strftime('%B %d at %I:%M %p')}

Please log in to approve or reject this task.

SecretaryAI"""
                    msg.attach(MIMEText(body, "plain"))
                    with smtplib.SMTP(smtp_host, smtp_port) as server:
                        server.ehlo()
                        server.starttls()
                        server.login(smtp_user, smtp_pass)
                        server.sendmail(smtp_user, smtp_user, msg.as_string())
                    logger.info(f"Reminder sent for task {task.id}")
                except Exception as e:
                    logger.error(f"Reminder error for task {task.id}: {e}")
    except Exception as e:
        logger.error(f"Reminder service error: {e}")