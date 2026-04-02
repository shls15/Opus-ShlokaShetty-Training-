from apscheduler.schedulers.asyncio import AsyncIOScheduler
from models.database import AsyncSessionLocal
from agents.email_agent import run_email_agent
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()
executor = ThreadPoolExecutor(max_workers=1)

async def poll_and_process():
    logger.info("Auto-polling Gmail...")
    try:
        from services.email_service import fetch_unread_emails
        loop = asyncio.get_event_loop()
        emails = await asyncio.wait_for(
            loop.run_in_executor(executor, fetch_unread_emails),
            timeout=20.0
        )
        if not emails:
            logger.info("No new emails.")
            return
        async with AsyncSessionLocal() as db:
            for e in emails:
                try:
                    result = await run_email_agent(
                        sender=e["sender"],
                        subject=e["subject"],
                        body=e["body"],
                        db=db,
                        attachments=e.get("attachments", [])
                    )
                    logger.info(f"Processed: {result}")
                except Exception as ex:
                    logger.error(f"Email processing error: {ex}")
    except asyncio.TimeoutError:
        logger.warning("Gmail poll timed out after 20s — skipping this cycle.")
    except Exception as ex:
        logger.error(f"Polling error: {ex}")

def start_scheduler():
    scheduler.add_job(
        poll_and_process,
        "interval",
        seconds=60,
        id="gmail_poller",
        replace_existing=True,
        max_instances=1
    )
    scheduler.start()
    logger.info("Auto-poller started — every 60 seconds.")

def stop_scheduler():
    scheduler.shutdown()