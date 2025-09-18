"""
Improved student models using subcollections
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class StudentStatus(str, Enum):
    EXPLORING = "Exploring"
    SHORTLISTING = "Shortlisting"
    APPLYING = "Applying"
    SUBMITTED = "Submitted"

class TimelineEventType(str, Enum):
    INTERACTION = "interaction"
    COMMUNICATION = "communication"
    NOTE = "note"
    TASK = "task"
    REMINDER = "reminder"

class Student(BaseModel):
    """Main student document - core identity + profile data"""
    # Core identity (immutable)
    id: str
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    country: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    grade: Optional[str] = Field(None, max_length=10)
    source: Optional[str] = Field(None, max_length=100)
    additional_data: Optional[dict] = None
    created_at: datetime
    
    # Profile data (mutable)
    status: StudentStatus = StudentStatus.EXPLORING
    last_active: datetime
    last_contacted_at: Optional[datetime] = None
    high_intent: bool = False
    needs_essay_help: bool = False

class StudentCreate(BaseModel):
    """Create a new student"""
    # Core fields
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    country: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    grade: Optional[str] = Field(None, max_length=10)
    source: Optional[str] = Field(None, max_length=100)
    additional_data: Optional[dict] = None
    
    # Profile fields
    status: StudentStatus = StudentStatus.EXPLORING
    high_intent: bool = False
    needs_essay_help: bool = False

class StudentUpdate(BaseModel):
    """Update student - only profile fields can be updated"""
    status: Optional[StudentStatus] = None
    last_active: Optional[datetime] = None
    last_contacted_at: Optional[datetime] = None
    high_intent: Optional[bool] = None
    needs_essay_help: Optional[bool] = None
    additional_data: Optional[dict] = None  # Only additional_data can be updated from core

class TimelineEvent(BaseModel):
    """Base timeline event"""
    id: str
    student_id: str
    type: TimelineEventType
    created_at: datetime
    created_by: str = "CRM Team"

class Interaction(TimelineEvent):
    """Student interaction event"""
    type: TimelineEventType = TimelineEventType.INTERACTION
    interaction_type: str  # "call", "email", "meeting", "other"
    description: str
    outcome: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None

class Communication(TimelineEvent):
    """Communication event"""
    type: TimelineEventType = TimelineEventType.COMMUNICATION
    communication_type: str  # "email", "sms", "call", "meeting"
    subject: Optional[str] = None
    content: str
    direction: str  # "inbound", "outbound"
    status: str = "sent"  # "sent", "delivered", "read", "failed"

class Note(TimelineEvent):
    """Internal note"""
    type: TimelineEventType = TimelineEventType.NOTE
    title: str
    content: str
    is_private: bool = True

class Task(TimelineEvent):
    """Task event"""
    type: TimelineEventType = TimelineEventType.TASK
    title: str
    description: str
    due_date: Optional[str] = None  # Accept date string instead of datetime
    status: str = "pending"  # "pending", "in_progress", "completed", "cancelled"
    priority: str = "medium"  # "low", "medium", "high", "urgent"
    student_name: Optional[str] = None

class Reminder(TimelineEvent):
    """Reminder event"""
    type: TimelineEventType = TimelineEventType.REMINDER
    title: str
    description: str
    reminder_date: datetime
    status: str = "pending"  # "pending", "sent", "completed", "cancelled"

# Create models for timeline events
class InteractionCreate(BaseModel):
    """Create interaction event"""
    interaction_type: str
    description: str
    outcome: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None

class CommunicationCreate(BaseModel):
    """Create communication event"""
    communication_type: str
    subject: Optional[str] = None
    content: str
    direction: str = "outbound"
    status: str = "sent"

class NoteCreate(BaseModel):
    """Create note event"""
    title: str
    content: str
    is_private: bool = True

class TaskCreate(BaseModel):
    """Create task event"""
    title: str
    description: str
    due_date: Optional[str] = None  # Accept date string instead of datetime
    status: str = "pending"
    priority: str = "medium"
    student_id: Optional[str] = None
    student_name: Optional[str] = None

class ReminderCreate(BaseModel):
    """Create reminder event"""
    title: str
    description: str
    reminder_date: datetime
    status: str = "pending"
