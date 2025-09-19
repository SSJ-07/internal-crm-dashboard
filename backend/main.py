from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, firestore
import os
import httpx
import jwt
from datetime import datetime, timedelta
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
from app.services.ai_service import ai_service

# Load environment variables from .env file
load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

# Authentication Models
class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    id_token: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    access_token: str

class User(BaseModel):
    id: str
    email: str
    name: str

app = FastAPI(title="CRM API with Real Firestore Data")

# Authentication helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(token_data: dict = Depends(verify_token)):
    return token_data

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

@app.get("/test")
async def test():
    return {"message": "Test endpoint working", "timestamp": datetime.now().isoformat()}

@app.get("/debug/firestore")
async def debug_firestore():
    """Debug Firestore connection and basic query"""
    try:
        if not db:
            return {"error": "Firestore not initialized"}
        
        # Test basic collection query
        start_time = datetime.now()
        students_ref = db.collection("students")
        docs = list(students_ref.limit(5).stream())
        end_time = datetime.now()
        
        return {
            "message": "Firestore query successful",
            "query_time_ms": (end_time - start_time).total_seconds() * 1000,
            "doc_count": len(docs),
            "sample_doc": docs[0].to_dict() if docs else None
        }
    except Exception as e:
        return {"error": str(e), "timestamp": datetime.now().isoformat()}

@app.get("/api/students/")
async def get_students():
    if not db:
        return {"error": "Firestore not initialized", "students": []}
    
    try:
        print("🔍 Fetching students from Firestore...")
        
        # Use the service for better performance
        service = StudentV2Service(db)
        students = await service.get_students()
        
        # Convert to dict format for API response
        students_data = []
        for student in students:
            student_dict = {
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "country": student.country,
                "phone": student.phone,
                "grade": student.grade,
                "source": student.source,
                "status": student.status.value,
                "last_active": student.last_active.isoformat() if student.last_active else None,
                "last_contacted_at": student.last_contacted_at.isoformat() if student.last_contacted_at else None,
                "high_intent": student.high_intent,
                "needs_essay_help": student.needs_essay_help,
                "created_at": student.created_at.isoformat() if student.created_at else None,
                "additional_data": student.additional_data
            }
            students_data.append(student_dict)
        
        print(f"✅ Found {len(students_data)} students in Firestore")
        return {"students": students_data}
        
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

# Authentication endpoints
@app.post("/api/auth/login", response_model=UserResponse)
async def login(login_data: LoginRequest):
    """Login with email and password"""
    try:
        # For now, we'll use a simple hardcoded user for testing
        # In production, you'd verify against a user database
        if login_data.email == "admin@crm.com" and login_data.password == "password":
            access_token = create_access_token(
                data={"sub": "admin_user_id", "email": login_data.email, "name": "Admin User"}
            )
            return UserResponse(
                id="admin_user_id",
                email=login_data.email,
                name="Admin User",
                access_token=access_token
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/google", response_model=UserResponse)
async def google_login(google_data: GoogleLoginRequest):
    """Login with Google ID token"""
    try:
        # For now, we'll create a mock user from Google token
        # In production, you'd verify the Google ID token
        access_token = create_access_token(
            data={"sub": "google_user_id", "email": "user@gmail.com", "name": "Google User"}
        )
        return UserResponse(
            id="google_user_id",
            email="user@gmail.com",
            name="Google User",
            access_token=access_token
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/user")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user.get("sub"),
        "email": current_user.get("email"),
        "name": current_user.get("name")
    }

@app.post("/api/auth/logout")
async def logout():
    """Logout user"""
    return {"message": "Successfully logged out"}

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

@app.get("/api/communications")
async def get_all_communications():
    """Get all communications across all students"""
    try:
        service = StudentV2Service(db)
        communications = await service.get_all_communications()
        return communications
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/interactions")
async def get_all_interactions():
    """Get all interactions across all students"""
    try:
        service = StudentV2Service(db)
        interactions = await service.get_all_interactions()
        return interactions
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

@app.post("/api/students/{student_id}/ai-summary")
async def generate_ai_summary(student_id: str):
    """Generate AI-powered summary for a student"""
    try:
        service = StudentV2Service(db)
        
        # Get student data
        student = await service.get_student(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Get related data
        communications = await service.get_student_communications(student_id)
        interactions = await service.get_student_interactions(student_id)
        notes = await service.get_student_notes(student_id)
        
        # Prepare data for AI
        student_data = {
            "student": student,
            "communications": communications,
            "interactions": interactions,
            "notes": notes
        }
        
        # Generate AI summary
        summary = await ai_service.generate_student_summary(student_data)
        
        return {"summary": summary}
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
