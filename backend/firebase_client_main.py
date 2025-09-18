from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import json

app = FastAPI(title="CRM API with Firebase Client SDK")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase configuration (same as your frontend)
FIREBASE_CONFIG = {
    "apiKey": "AIzaSyBvQZvQZvQZvQZvQZvQZvQZvQZvQZvQZvQ",  # This will be replaced
    "authDomain": "internal-crm-dashboard.firebaseapp.com",
    "projectId": "internal-crm-dashboard",
    "storageBucket": "internal-crm-dashboard.appspot.com",
    "messagingSenderId": "123456789",
    "appId": "1:123456789:web:abcdef"
}

@app.get("/")
async def root():
    return {"message": "CRM API with Firebase Client SDK"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/students/")
async def get_students():
    try:
        # For now, let's return some sample data that matches your Firestore structure
        # This simulates what we would get from Firestore
        students = [
            {
                "id": "AMczF3fHcr1D2c0ellyw",
                "name": "Hiroshi Tanaka",
                "email": "hiroshi.tanaka@example.com",
                "country": "Japan",
                "status": "Exploring",
                "last_active": "2024-09-17T18:02:45Z",
                "last_contacted_at": None,
                "high_intent": True,
                "needs_essay_help": False,
                "phone": "+81312345678",
                "grade": "11th",
                "source": "Website Registration",
                "additional_data": None,
                "created_at": "2024-09-17T18:02:45Z"
            },
            {
                "id": "sample_id_2",
                "name": "Sarah Johnson",
                "email": "sarah.johnson@example.com",
                "country": "United States",
                "status": "Shortlisting",
                "last_active": "2024-09-16T14:30:00Z",
                "last_contacted_at": "2024-09-15T10:00:00Z",
                "high_intent": False,
                "needs_essay_help": True,
                "phone": "+1234567890",
                "grade": "12th",
                "source": "Referral",
                "additional_data": None,
                "created_at": "2024-09-15T14:30:00Z"
            },
            {
                "id": "sample_id_3",
                "name": "Maria Garcia",
                "email": "maria.garcia@example.com",
                "country": "Spain",
                "status": "Applying",
                "last_active": "2024-09-17T09:15:00Z",
                "last_contacted_at": "2024-09-16T16:45:00Z",
                "high_intent": True,
                "needs_essay_help": True,
                "phone": "+34123456789",
                "grade": "12th",
                "source": "Website Registration",
                "additional_data": None,
                "created_at": "2024-09-14T09:15:00Z"
            }
        ]
        
        return {"students": students}
        
    except Exception as e:
        print(f"Error fetching students: {e}")
        return {"error": str(e), "students": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
