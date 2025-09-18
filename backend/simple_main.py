from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime

app = FastAPI(title="CRM API with Real Firestore Data")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin SDK
def init_firebase():
    try:
        # Try to get existing app first
        app_firebase = firebase_admin.get_app()
        return firestore.client()
    except ValueError:
        # No app exists, create one
        project_id = os.getenv('FIREBASE_PROJECT_ID', 'internal-crm-dashboard')
        
        print(f"Initializing Firebase with project ID: {project_id}")
        
        # For now, let's use a simple approach without credentials
        # This will work if your Firestore rules allow public read access
        try:
            # Initialize without credentials (for public access)
            firebase_admin.initialize_app(options={'projectId': project_id})
            print("Firebase initialized successfully")
            return firestore.client()
        except Exception as e:
            print(f"Firebase initialization error: {e}")
            print("Trying alternative approach...")
            
            # Alternative: try with default credentials
            try:
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred, {'projectId': project_id})
                print("Firebase initialized with default credentials")
                return firestore.client()
            except Exception as e2:
                print(f"Alternative Firebase initialization also failed: {e2}")
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
            if 'lastActive' in student_data and hasattr(student_data['lastActive'], 'isoformat'):
                student_data['last_active'] = student_data['lastActive'].isoformat()
            if 'lastContactedAt' in student_data and student_data['lastContactedAt'] and hasattr(student_data['lastContactedAt'], 'isoformat'):
                student_data['last_contacted_at'] = student_data['lastContactedAt'].isoformat()
            else:
                student_data['last_contacted_at'] = None
            
            # Map field names to match frontend expectations
            mapped_student = {
                'id': student_data.get('id'),
                'name': student_data.get('name'),
                'email': student_data.get('email'),
                'country': student_data.get('country'),
                'status': student_data.get('status'),
                'last_active': student_data.get('last_active', student_data.get('lastActive', '')),
                'last_contacted_at': student_data.get('last_contacted_at'),
                'high_intent': student_data.get('highIntent', False),
                'needs_essay_help': student_data.get('needsEssayHelp', False),
                'phone': student_data.get('phone'),
                'grade': student_data.get('grade'),
                'source': student_data.get('source'),
                'additional_data': student_data.get('additionalData'),
                'created_at': student_data.get('created_at', student_data.get('createdAt', ''))
            }
            
            students.append(mapped_student)
        
        return {"students": students}
        
    except Exception as e:
        print(f"Error fetching students: {e}")
        return {"error": str(e), "students": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
