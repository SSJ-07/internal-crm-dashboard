"""
Pydantic models for Student data validation
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class StudentStatus(str, Enum):
    EXPLORING = "Exploring"
    SHORTLISTING = "Shortlisting"
    APPLYING = "Applying"
    SUBMITTED = "Submitted"

class StudentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    grade: Optional[str] = Field(None, max_length=10)
    country: str = Field(..., min_length=1, max_length=100)
    status: StudentStatus = StudentStatus.EXPLORING
    high_intent: bool = False
    needs_essay_help: bool = False
    source: Optional[str] = Field(None, max_length=100)
    additional_data: Optional[Dict[str, Any]] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    grade: Optional[str] = Field(None, max_length=10)
    country: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[StudentStatus] = None
    high_intent: Optional[bool] = None
    needs_essay_help: Optional[bool] = None
    source: Optional[str] = Field(None, max_length=100)
    additional_data: Optional[Dict[str, Any]] = None

class Student(StudentBase):
    id: str
    created_at: datetime
    last_active: datetime
    last_contacted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudentSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=100)
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)
    status_filter: Optional[StudentStatus] = None
    country_filter: Optional[str] = None
    high_intent_only: bool = False
    needs_essay_help_only: bool = False
    not_contacted_7_days: bool = False

class StudentSearchResponse(BaseModel):
    students: list[Student]
    total: int
    page: int
    limit: int
    has_more: bool

class StudentBulkImport(BaseModel):
    students: list[StudentCreate]
    validate_only: bool = False

class StudentBulkImportResult(BaseModel):
    success: bool
    imported: int
    failed: int
    errors: list[Dict[str, Any]] = []
    summary: Optional[Dict[str, int]] = None

class StudentAnalyticsRequest(BaseModel):
    date_range_days: int = Field(30, ge=1, le=365)
    include_demographics: bool = True
    include_engagement: bool = True

class StudentAnalyticsResponse(BaseModel):
    overview: Dict[str, int]
    status_breakdown: Dict[str, int]
    country_breakdown: Dict[str, int]
    engagement_metrics: Dict[str, Any]
    trends: Dict[str, Any]

class StudentExportRequest(BaseModel):
    format: str = Field(..., regex="^(csv|json)$")
    filters: Optional[Dict[str, Any]] = None
