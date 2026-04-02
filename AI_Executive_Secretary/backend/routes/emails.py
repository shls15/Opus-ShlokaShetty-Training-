from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from AI_Executive_Secretary.backend.models.database import get_db
from AI_Executive_Secretary.backend.models.orm_models import Email, Attachment
from AI_Executive_Secretary.backend.models.schemas import EmailIngest, EmailOut, AttachmentOut
from AI_Executive_Secretary.backend.agents.email_agent import run_email_agent
from AI_Executive_Secretary.backend.services.email_service import fetch_unread_emails
from typing import List
import base64
from fastapi.responses import Response

router = APIRouter()

@router.post("/ingest")
async def ingest_email(
    payload: EmailIngest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    result = await run_email_agent(
        sender=payload.sender,
        subject=payload.subject,
        body=payload.body,
        db=db
    )
    return result

@router.get("/", response_model=List[EmailOut])
async def get_all_emails(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Email).order_by(Email.received_at.desc()))
    return result.scalars().all()

@router.get("/{email_id}", response_model=EmailOut)
async def get_email(email_id: int, db: AsyncSession = Depends(get_db)):
    from fastapi import HTTPException
    result = await db.execute(select(Email).where(Email.id == email_id))
    email = result.scalars().first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return email

@router.post("/poll")
async def poll_gmail(db: AsyncSession = Depends(get_db)):
    emails = fetch_unread_emails()
    results = []
    for e in emails:
        result = await run_email_agent(
            sender=e["sender"],
            subject=e["subject"],
            body=e["body"],
            db=db,
            attachments=e.get("attachments", [])
        )
        results.append(result)
    return {"fetched": len(emails), "results": results}

@router.get("/{email_id}/attachments", response_model=List[AttachmentOut])
async def get_attachments(email_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Attachment).where(Attachment.email_id == email_id)
    )
    return result.scalars().all()

@router.get("/attachments/{attachment_id}/download")
async def download_attachment(attachment_id: int, db: AsyncSession = Depends(get_db)):
    from fastapi import HTTPException
    result = await db.execute(select(Attachment).where(Attachment.id == attachment_id))
    att = result.scalars().first()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    file_bytes = base64.b64decode(att.file_data)
    return Response(
        content=file_bytes,
        media_type=att.content_type,
        headers={"Content-Disposition": f"attachment; filename={att.filename}"}
    )