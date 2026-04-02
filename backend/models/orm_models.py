from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from models.database import Base


class PriorityEnum(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"


class StatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    completed = "completed"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(150), unique=True, index=True)
    hashed_password = Column(String(255))
    role = Column(String(50), default="executive")
    created_at = Column(DateTime, default=datetime.utcnow)


class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String(150))
    subject = Column(String(300))
    body = Column(Text)
    meet_link = Column(String(500), nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)
    sender_timezone = Column(String(100), nullable=True)

    tasks = relationship("Task", back_populates="email")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"))
    title = Column(String(300))
    description = Column(Text)
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.medium)
    status = Column(Enum(StatusEnum), default=StatusEnum.pending)
    estimated_minutes = Column(Integer, default=30)
    requested_datetime = Column(DateTime, nullable=True)
    task_type = Column(String(50), default="other")
    created_at = Column(DateTime, default=datetime.utcnow)
    email = relationship("Email", back_populates="tasks")
    schedule = relationship("Schedule", back_populates="task", uselist=False)
    notifications = relationship("Notification", back_populates="task")
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String(50), nullable=True)


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    calendar_event_id = Column(String(200), nullable=True)
    google_event_id = Column(String(200), nullable=True)
    meet_link = Column(String(500), nullable=True)
    html_link = Column(String(500), nullable=True)
    is_rescheduled = Column(Boolean, default=False)

    task = relationship("Task", back_populates="schedule")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    recipient_email = Column(String(150))
    sent_at = Column(DateTime, nullable=True)
    type = Column(String(50))

    task = relationship("Task", back_populates="notifications")

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    work_start_hour = Column(Integer, default=9)
    work_end_hour = Column(Integer, default=18)
    work_days = Column(String(20), default="1,2,3,4,5")
    lunch_start = Column(Integer, nullable=True)
    lunch_end = Column(Integer, nullable=True)
    slot_interval_minutes = Column(Integer, default=30)
    buffer_minutes = Column(Integer, default=10)

    user = relationship("User", backref="settings")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"))
    filename = Column(String(300))
    content_type = Column(String(100))
    file_data = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    email = relationship("Email", backref="attachments")