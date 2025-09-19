#!/usr/bin/env python3
"""
Script to add dummy interaction data to test students
"""

import os
import sys
import asyncio
from datetime import datetime, timedelta
import random
import firebase_admin
from firebase_admin import credentials, firestore

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.student_v2_service import StudentV2Service
from app.models.student_v2 import InteractionCreate

# Initialize Firebase
def init_firebase():
    try:
        # Try to get existing app first
        app_firebase = firebase_admin.get_app()
        return firestore.client()
    except ValueError:
        # No existing app, create new one
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
            print(f"❌ Error initializing Firebase: {e}")
            return None

# Initialize Firestore
db = init_firebase()

# Sample interaction data
INTERACTION_TYPES = [
    "login",
    "page_view", 
    "document_upload",
    "form_submission",
    "email_click",
    "video_watch",
    "quiz_completion",
    "profile_update",
    "search_query",
    "download_resource"
]

INTERACTION_DETAILS = {
    "login": [
        "Student logged into the platform",
        "Successful login from web browser",
        "Login from mobile device",
        "Login after password reset"
    ],
    "page_view": [
        "Viewed college application checklist",
        "Browsed university profiles",
        "Checked application deadlines",
        "Viewed essay writing tips",
        "Explored scholarship opportunities",
        "Read success stories"
    ],
    "document_upload": [
        "Uploaded high school transcript",
        "Submitted SAT scores",
        "Uploaded recommendation letter",
        "Added personal statement draft",
        "Submitted financial aid documents",
        "Uploaded portfolio samples"
    ],
    "form_submission": [
        "Completed interest survey",
        "Submitted college preferences",
        "Filled out contact information",
        "Completed essay prompt selection",
        "Submitted application timeline",
        "Updated academic goals"
    ],
    "email_click": [
        "Clicked on college recommendation email",
        "Opened essay writing workshop invite",
        "Clicked scholarship opportunity link",
        "Opened deadline reminder",
        "Clicked application status update"
    ],
    "video_watch": [
        "Watched college application tutorial",
        "Viewed essay writing workshop",
        "Watched university campus tour",
        "Completed financial aid webinar",
        "Watched interview preparation video"
    ],
    "quiz_completion": [
        "Completed college readiness assessment",
        "Finished personality quiz",
        "Completed study skills evaluation",
        "Finished career interest survey",
        "Completed academic planning quiz"
    ],
    "profile_update": [
        "Updated contact information",
        "Modified academic interests",
        "Updated college preferences",
        "Changed notification settings",
        "Updated profile picture"
    ],
    "search_query": [
        "Searched for engineering programs",
        "Looked up scholarship requirements",
        "Searched for essay writing help",
        "Queried application deadlines",
        "Searched for financial aid info"
    ],
    "download_resource": [
        "Downloaded application checklist",
        "Saved essay writing guide",
        "Downloaded college comparison sheet",
        "Saved financial aid worksheet",
        "Downloaded interview prep materials"
    ]
}

async def add_dummy_interactions():
    """Add dummy interaction data to all students"""
    
    if not db:
        print("❌ Failed to initialize Firebase")
        return
    
    # Initialize service
    student_service = StudentV2Service(db)
    
    try:
        # Get all students
        students = await student_service.get_students(limit=1000)
        
        if not students:
            print("No students found!")
            return
        
        print(f"Found {len(students)} students. Adding dummy interactions...")
        
        for student in students:
            # Convert Pydantic model to dict if needed
            if hasattr(student, 'dict'):
                student_dict = student.dict()
            elif hasattr(student, '__dict__'):
                student_dict = student.__dict__
            else:
                student_dict = student
            
            student_id = student_dict.get('id')
            student_name = student_dict.get('name', 'Unknown')
            
            if not student_id:
                continue
                
            print(f"\nAdding interactions for {student_name} ({student_id})")
            
            # Generate 5-15 random interactions per student
            num_interactions = random.randint(5, 15)
            
            for i in range(num_interactions):
                # Random interaction type
                interaction_type = random.choice(INTERACTION_TYPES)
                detail = random.choice(INTERACTION_DETAILS[interaction_type])
                
                # Random date within last 30 days
                days_ago = random.randint(0, 30)
                created_at = datetime.now() - timedelta(days=days_ago)
                
                # Create interaction data
                interaction_data = InteractionCreate(
                    interaction_type=interaction_type,
                    description=detail,
                    outcome=random.choice(["successful", "incomplete", "needs_followup"]),
                    follow_up_required=random.choice([True, False]),
                    follow_up_date=created_at + timedelta(days=random.randint(1, 7)) if random.choice([True, False]) else None
                )
                
                try:
                    await student_service.create_interaction(student_id, interaction_data)
                    print(f"  ✓ Added {interaction_type}: {detail}")
                except Exception as e:
                    print(f"  ✗ Failed to add interaction: {e}")
        
        print(f"\n✅ Successfully added dummy interactions to {len(students)} students!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(add_dummy_interactions())
