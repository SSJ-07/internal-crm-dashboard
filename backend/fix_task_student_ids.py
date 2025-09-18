#!/usr/bin/env python3
"""
Fix existing tasks by updating their student_id to match the actual student
based on student_name matching.
"""

import firebase_admin
from firebase_admin import credentials, firestore
import os

def init_firebase():
    try:
        # Try to get existing app first
        app = firebase_admin.get_app()
        return firestore.client()
    except ValueError:
        # No app exists, create one
        project_id = "internal-crm-dashboard"
        service_account_path = './internal-crm-dashboard-firebase-adminsdk-fbsvc-5922f27c61.json'
        
        print(f"Initializing Firebase with project ID: {project_id}")
        print(f"Using service account: {service_account_path}")
        
        try:
            # Initialize with service account credentials
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred, {'projectId': project_id})
            print("✅ Firebase initialized successfully with service account")
            return firestore.client()
        except Exception as e:
            print(f"❌ Failed to initialize Firebase: {e}")
            return None

def fix_task_student_ids():
    """Fix existing tasks by updating their student_id based on student_name"""
    db = init_firebase()
    if not db:
        print("❌ Failed to initialize Firebase")
        return
    
    try:
        # Get all students
        print("🔍 Fetching students...")
        students_docs = db.collection('students').stream()
        students = {}
        for doc in students_docs:
            data = doc.to_dict()
            students[data.get('name', '')] = doc.id
        print(f"✅ Found {len(students)} students")
        
        # Get all tasks
        print("🔍 Fetching tasks...")
        tasks_docs = db.collection('tasks').stream()
        tasks_to_update = []
        
        for doc in tasks_docs:
            data = doc.to_dict()
            task_id = doc.id
            student_name = data.get('student_name')
            current_student_id = data.get('student_id', 'standalone')
            
            # Only update tasks that have student_name but student_id is "standalone"
            if student_name and current_student_id == 'standalone':
                if student_name in students:
                    tasks_to_update.append({
                        'task_id': task_id,
                        'student_name': student_name,
                        'new_student_id': students[student_name],
                        'title': data.get('title', 'Unknown')
                    })
                else:
                    print(f"⚠️  No student found for name: {student_name}")
        
        print(f"📝 Found {len(tasks_to_update)} tasks to update")
        
        # Update tasks
        for task in tasks_to_update:
            try:
                db.collection('tasks').document(task['task_id']).update({
                    'student_id': task['new_student_id']
                })
                print(f"✅ Updated task '{task['title']}' -> {task['student_name']} ({task['new_student_id']})")
            except Exception as e:
                print(f"❌ Failed to update task {task['task_id']}: {e}")
        
        print(f"🎉 Successfully updated {len(tasks_to_update)} tasks")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_task_student_ids()
