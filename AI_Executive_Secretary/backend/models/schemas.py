from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PriorityEnum(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class StatusEnum(str, Enum):
    pending = "pending"
    approved = "approved"
    completed = "completed"
    rejected = "rejected"


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "executive"


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str


class EmailIngest(BaseModel):
    sender: str
    subject: str
    body: str


class EmailOut(BaseModel):
    id: int
    sender: str
    subject: str
    body: str
    received_at: datetime
    processed: bool

    class Config:
        from_attributes = True


class TaskOut(BaseModel):
    id: int
    email_id: int
    title: str
    description: str
    priority: PriorityEnum
    status: StatusEnum
    estimated_minutes: int
    created_at: datetime

    class Config:
        from_attributes = True


class TaskUpdate(BaseModel):
    status: Optional[StatusEnum] = None
    priority: Optional[PriorityEnum] = None
    title: Optional[str] = None
    description: Optional[str] = None
    estimated_minutes: Optional[int] = None


class ScheduleOut(BaseModel):
    id: int
    task_id: int
    start_time: datetime
    end_time: datetime
    calendar_event_id: Optional[str]
    google_event_id: Optional[str]
    meet_link: Optional[str]
    html_link: Optional[str]
    is_rescheduled: bool

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: int
    task_id: int
    recipient_email: str
    sent_at: Optional[datetime]
    type: str

    class Config:
        from_attributes = True

class UserSettingsCreate(BaseModel):
    work_start_hour: int = 9
    work_end_hour: int = 18
    work_days: str = "1,2,3,4,5"
    lunch_start: Optional[int] = None
    lunch_end: Optional[int] = None
    slot_interval_minutes: int = 30
    buffer_minutes: int = 10

class UserSettingsOut(BaseModel):
    id: int
    user_id: int
    work_start_hour: int
    work_end_hour: int
    work_days: str
    lunch_start: Optional[int]
    lunch_end: Optional[int]
    slot_interval_minutes: int
    buffer_minutes: int = 10

    class Config:
        from_attributes = True

class AttachmentOut(BaseModel):
    id: int
    email_id: int
    filename: str
    content_type: str
    created_at: datetime

    class Config:
        from_attributes = True