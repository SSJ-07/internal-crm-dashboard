"""
Email sending endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from app.models.email import EmailSendRequest, EmailSendResponse
from app.core.auth import verify_firebase_token
from app.services.email_service import EmailService
from app.core.config import settings

router = APIRouter()

@router.post("/send", response_model=EmailSendResponse)
async def send_email(
    email_request: EmailSendRequest,
    current_user: dict = Depends(verify_firebase_token)
):
    """Send an email to a student"""
    try:
        service = EmailService()
        result = await service.send_email(email_request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test")
async def test_email(
    current_user: dict = Depends(verify_firebase_token)
):
    """Test email functionality"""
    try:
        service = EmailService()
        test_request = EmailSendRequest(
            to="test@example.com",
            subject="Test Email",
            html="<p>This is a test email from the CRM system.</p>",
            from_name="CRM System"
        )
        result = await service.send_email(test_request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
