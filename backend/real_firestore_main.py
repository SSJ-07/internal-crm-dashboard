from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import os
import httpx
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="CRM API with Real Firestore Data")

# Pydantic models for email
class EmailSendRequest(BaseModel):
    to: str
    subject: str
    html: str
    from_name: Optional[str] = None

class EmailSendResponse(BaseModel):
    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin SDK with your service account
def init_firebase():
    try:
        # Try to get existing app first
        app_firebase = firebase_admin.get_app()
        return firestore.client()
    except ValueError:
        # No app exists, create one
        project_id = "internal-crm-dashboard"
        
        # Get the service account key path
        service_account_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', './internal-crm-dashboard-firebase-adminsdk-fbsvc-5922f27c61.json')
        
        print(f"Initializing Firebase with project ID: {project_id}")
        print(f"Using service account: {service_account_path}")
        
        try:
            # Initialize with service account credentials
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred, {'projectId': project_id})
            print("✅ Firebase initialized successfully with service account")
            return firestore.client()
        except Exception as e:
            print(f"❌ Firebase initialization error: {e}")
            return None

# Initialize Firestore
db = init_firebase()

@app.get("/")
async def root():
    return {"message": "CRM API with Real Firestore Data"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/students/")
async def get_students():
    if not db:
        return {"error": "Firestore not initialized", "students": []}
    
    try:
        print("🔍 Fetching students from Firestore...")
        
        # Get all students from Firestore
        students_ref = db.collection('students')
        docs = students_ref.stream()
        
        students = []
        for doc in docs:
            student_data = doc.to_dict()
            student_data['id'] = doc.id
            
            # Convert Firestore timestamps to ISO strings
            if 'createdAt' in student_data and hasattr(student_data['createdAt'], 'isoformat'):
                student_data['created_at'] = student_data['createdAt'].isoformat()
            else:
                student_data['created_at'] = str(student_data.get('createdAt', ''))
                
            if 'lastActive' in student_data and hasattr(student_data['lastActive'], 'isoformat'):
                student_data['last_active'] = student_data['lastActive'].isoformat()
            else:
                student_data['last_active'] = str(student_data.get('lastActive', ''))
                
            if 'lastContactedAt' in student_data and student_data['lastContactedAt']:
                if hasattr(student_data['lastContactedAt'], 'isoformat'):
                    student_data['last_contacted_at'] = student_data['lastContactedAt'].isoformat()
                else:
                    student_data['last_contacted_at'] = str(student_data['lastContactedAt'])
            else:
                student_data['last_contacted_at'] = None
            
            # Map field names to match frontend expectations
            mapped_student = {
                'id': student_data.get('id'),
                'name': student_data.get('name'),
                'email': student_data.get('email'),
                'country': student_data.get('country'),
                'status': student_data.get('status'),
                'last_active': student_data.get('last_active'),
                'last_contacted_at': student_data.get('last_contacted_at'),
                'high_intent': student_data.get('highIntent', False),
                'needs_essay_help': student_data.get('needsEssayHelp', False),
                'phone': student_data.get('phone'),
                'grade': student_data.get('grade'),
                'source': student_data.get('source'),
                'additional_data': student_data.get('additionalData'),
                'created_at': student_data.get('created_at')
            }
            
            students.append(mapped_student)
        
        print(f"✅ Found {len(students)} students in Firestore")
        return {"students": students}
        
    except Exception as e:
        print(f"❌ Error fetching students: {e}")
        return {"error": str(e), "students": []}

@app.post("/api/email/send", response_model=EmailSendResponse)
async def send_email(email_request: EmailSendRequest):
    """Send an email using Resend API"""
    try:
        # Get Resend API key from environment
        resend_api_key = os.getenv('RESEND_API_KEY')
        if not resend_api_key:
            return EmailSendResponse(
                success=False,
                error="Email service not configured. Please set RESEND_API_KEY in .env file"
            )
        
        # For now, send all emails to your Gmail instead of the actual recipient
        actual_recipient = "sumedh.sa.jadhav@gmail.com"
        from_address = f"{email_request.from_name} <onboarding@resend.dev>" if email_request.from_name else "onboarding@resend.dev"
        
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
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json"
                },
                json=email_data,
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Email sent successfully: {result.get('id')}")
                return EmailSendResponse(
                    success=True,
                    message_id=result.get("id")
                )
            else:
                error_data = response.json()
                print(f"❌ Email send failed: {error_data}")
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
        print(f"❌ Email error: {e}")
        return EmailSendResponse(
            success=False,
            error=f"Failed to send email: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
