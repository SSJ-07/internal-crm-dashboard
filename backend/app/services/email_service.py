"""
Email service for sending emails
"""

import httpx
from app.models.email import EmailSendRequest, EmailSendResponse
from app.core.config import settings

class EmailService:
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.EMAIL_FROM

    async def send_email(self, email_request: EmailSendRequest) -> EmailSendResponse:
        """Send an email using Resend API"""
        try:
            if not self.api_key:
                return EmailSendResponse(
                    success=False,
                    error="Email service not configured"
                )
            
            # For now, send all emails to your Gmail instead of the actual recipient
            actual_recipient = "sumedh.sa.jadhav@gmail.com"
            from_address = f"{email_request.from_name} <{self.from_email}>" if email_request.from_name else self.from_email
            
            # Prepare email data
            email_data = {
                "from": from_address,
                "to": actual_recipient,
                "subject": f"[TO: {email_request.to}] {email_request.subject}",
                "html": f"""
                <p><strong>Original recipient:</strong> {email_request.to}</p>
                <p><strong>From:</strong> {email_request.from_name or "CRM Team"}</p>
                <hr>
                {email_request.html}
                """
            }
            
            # Send email via Resend API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=email_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return EmailSendResponse(
                        success=True,
                        message_id=result.get("id")
                    )
                else:
                    error_data = response.json()
                    return EmailSendResponse(
                        success=False,
                        error=error_data.get("message", f"HTTP {response.status_code}")
                    )
                    
        except httpx.TimeoutException:
            return EmailSendResponse(
                success=False,
                error="Email service timeout"
            )
        except Exception as e:
            return EmailSendResponse(
                success=False,
                error=f"Failed to send email: {str(e)}"
            )
