from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import os
import httpx
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

# Import new student models and services
from app.models.student_v2 import (
    Student, StudentCreate, StudentUpdate,
    Interaction, InteractionCreate,
    Communication, CommunicationCreate,
    Note, NoteCreate,
    Task, TaskCreate,
    Reminder, ReminderCreate,
    TimelineEventType
)
from app.services.student_v2_service import StudentV2Service

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

# Initialize Firebase
db = init_firebase()

# Student endpoints
@app.get("/api/students", response_model=List[Student])
async def get_students():
    """Get all students"""
    try:
        service = StudentV2Service(db)
        students = await service.get_students()
        return students
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/{student_id}", response_model=Student)
async def get_student(student_id: str):
    """Get a specific student by ID"""
    try:
        service = StudentV2Service(db)
        student = await service.get_student(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        return student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/students", response_model=Student)
async def create_student(student_data: StudentCreate):
    """Create a new student"""
    try:
        service = StudentV2Service(db)
        student = await service.create_student(student_data)
        return student
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/students/{student_id}", response_model=Student)
async def update_student(student_id: str, student_update: StudentUpdate):
    """Update a student - only profile fields can be updated"""
    try:
        service = StudentV2Service(db)
        student = await service.update_student(student_id, student_update)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        return student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/students/{student_id}")
async def delete_student(student_id: str):
    """Delete a student"""
    try:
        service = StudentV2Service(db)
        success = await service.delete_student(student_id)
        if not success:
            raise HTTPException(status_code=404, detail="Student not found")
        return {"message": "Student deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Timeline events endpoints
@app.get("/api/students/{student_id}/timeline")
async def get_timeline_events(student_id: str, event_type: Optional[str] = None):
    """Get timeline events for a student"""
    try:
        service = StudentV2Service(db)
        if event_type:
            event_type_enum = TimelineEventType(event_type)
            events = await service.get_timeline_events(student_id, event_type_enum)
        else:
            events = await service.get_timeline_events(student_id)
        return events
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid event type: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/students/{student_id}/interactions", response_model=Interaction)
async def create_interaction(student_id: str, interaction_data: InteractionCreate):
    """Create an interaction event"""
    try:
        service = StudentV2Service(db)
        interaction = await service.create_interaction(student_id, interaction_data)
        return interaction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/students/{student_id}/communications", response_model=Communication)
async def create_communication(student_id: str, communication_data: CommunicationCreate):
    """Create a communication event"""
    try:
        service = StudentV2Service(db)
        communication = await service.create_communication(student_id, communication_data)
        return communication
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/students/{student_id}/notes", response_model=Note)
async def create_note(student_id: str, note_data: NoteCreate):
    """Create a note event"""
    try:
        service = StudentV2Service(db)
        note = await service.create_note(student_id, note_data)
        return note
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/students/{student_id}/tasks", response_model=Task)
async def create_task(student_id: str, task_data: TaskCreate):
    """Create a task event"""
    try:
        service = StudentV2Service(db)
        task = await service.create_task(student_id, task_data)
        return task
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/students/{student_id}/reminders", response_model=Reminder)
async def create_reminder(student_id: str, reminder_data: ReminderCreate):
    """Create a reminder event"""
    try:
        service = StudentV2Service(db)
        reminder = await service.create_reminder(student_id, reminder_data)
        return reminder
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Reminders endpoints (standalone reminders collection)
@app.get("/api/reminders")
async def get_reminders():
    """Get all reminders"""
    try:
        service = StudentV2Service(db)
        reminders = await service.get_all_reminders()
        return reminders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reminders", response_model=Reminder)
async def create_standalone_reminder(reminder_data: ReminderCreate):
    """Create a standalone reminder"""
    try:
        service = StudentV2Service(db)
        reminder = await service.create_standalone_reminder(reminder_data)
        return reminder
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Dashboard endpoints
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        service = StudentV2Service(db)
        stats = await service.get_dashboard_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Authentication endpoints
@app.get("/api/auth/user")
async def get_current_user():
    """Get current user information"""
    # For now, return a mock user since we're not implementing full auth yet
    # In a real implementation, this would validate JWT tokens or session cookies
    return {
        "uid": "mock-user-123",
        "email": "crm@example.com",
        "displayName": "CRM Team",
        "photoURL": None
    }

@app.post("/api/auth/logout")
async def logout():
    """Logout user"""
    # In a real implementation, this would invalidate JWT tokens or session cookies
    return {"message": "Logged out successfully"}

# Tasks endpoints
@app.get("/api/tasks")
async def get_tasks():
    """Get all tasks"""
    try:
        service = StudentV2Service(db)
        tasks = await service.get_all_tasks()
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks", response_model=Task)
async def create_task(task_data: TaskCreate):
    """Create a new task"""
    try:
        service = StudentV2Service(db)
        task = await service.create_standalone_task(task_data)
        return task
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, task_data: dict):
    """Update a task"""
    try:
        service = StudentV2Service(db)
        task = await service.update_task(task_id, task_data)
        return task
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    """Permanently delete a task"""
    try:
        service = StudentV2Service(db)
        await service.delete_task(task_id)
        return {"message": "Task deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Additional student profile endpoints
@app.put("/api/students/{student_id}/last-active")
async def update_student_last_active(student_id: str):
    """Update student's last active timestamp"""
    try:
        service = StudentV2Service(db)
        student = await service.update_student_last_active(student_id)
        return student
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/{student_id}/interactions")
async def get_student_interactions(student_id: str):
    """Get all interactions for a student"""
    try:
        service = StudentV2Service(db)
        interactions = await service.get_student_interactions(student_id)
        return interactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/{student_id}/communications")
async def get_student_communications(student_id: str):
    """Get all communications for a student"""
    try:
        service = StudentV2Service(db)
        communications = await service.get_student_communications(student_id)
        return communications
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/{student_id}/notes")
async def get_student_notes(student_id: str):
    """Get all notes for a student"""
    try:
        service = StudentV2Service(db)
        notes = await service.get_student_notes(student_id)
        return notes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/students/{student_id}/notes/{note_id}")
async def update_student_note(student_id: str, note_id: str, note_data: dict):
    """Update a specific note for a student"""
    try:
        service = StudentV2Service(db)
        note = await service.update_student_note(student_id, note_id, note_data)
        return note
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/students/{student_id}/notes/{note_id}")
async def delete_student_note(student_id: str, note_id: str):
    """Delete a specific note for a student"""
    try:
        service = StudentV2Service(db)
        await service.delete_student_note(student_id, note_id)
        return {"message": "Note deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/students/{student_id}/checkboxes")
async def update_student_checkboxes(student_id: str, checkbox_data: dict):
    """Update student checkboxes (high_intent, needs_essay_help)"""
    try:
        service = StudentV2Service(db)
        student = await service.update_student_checkboxes(student_id, checkbox_data)
        return student
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
