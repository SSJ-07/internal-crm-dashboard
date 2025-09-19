from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import Firebase admin setup
from firebase_admin import initialize_app, credentials
import firebase_admin

# Initialize Firebase Admin SDK
try:
    # Try to initialize Firebase if not already initialized
    if not firebase_admin._apps:
        cred = credentials.Certificate("./internal-crm-dashboard-firebase-adminsdk-fbsvc-5922f27c61.json")
        initialize_app(cred)
        print("Initializing Firebase with project ID: internal-crm-dashboard")
        print("Using service account: ./internal-crm-dashboard-firebase-adminsdk-fbsvc-5922f27c61.json")
        print("✅ Firebase initialized successfully with service account")
    else:
        print("Firebase already initialized")
except Exception as e:
    print(f"❌ Error initializing Firebase: {e}")

# Create FastAPI app
app = FastAPI(title="CRM Backend", description="FastAPI backend for CRM dashboard")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from routers import students, auth

app.include_router(students.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "CRM Backend Running", "status": "healthy"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
