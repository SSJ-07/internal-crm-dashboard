"""
Pydantic models for Email functionality
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class EmailSendRequest(BaseModel):
    to: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    html: str = Field(..., min_length=1)
    from_name: Optional[str] = Field(None, max_length=100)

class EmailSendResponse(BaseModel):
    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None
