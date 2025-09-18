"""
Migration script to move existing data to the new subcollection structure
"""
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
from datetime import datetime

def init_firebase():
    try:
        app = firebase_admin.get_app()
        return firestore.client()
    except ValueError:
        project_id = "internal-crm-dashboard"
        service_account_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', './internal-crm-dashboard-firebase-adminsdk-fbsvc-5922f27c61.json')
        
        cred = credentials.Certificate(service_account_path)
        app = firebase_admin.initialize_app(cred, {'projectId': project_id})
        return firestore.client()

def migrate_students():
    """Migrate students from old structure to new subcollection structure"""
    db = init_firebase()
    
    print("🔄 Starting migration to subcollection structure...")
    
    # Get all students from the old structure
    old_students = db.collection("students").stream()
    migrated_count = 0
    
    for doc in old_students:
        student_data = doc.to_dict()
        student_id = doc.id
        
        # Skip corrupted students (with null names/emails)
        if not student_data.get("name") or not student_data.get("email"):
            print(f"⚠️  Skipping corrupted student {student_id}")
            continue
        
        print(f"📝 Migrating student: {student_data.get('name', 'Unknown')}")
        
        # Create new student document with combined data
        new_student_data = {
            # Core identity (immutable)
            "name": student_data.get("name"),
            "email": student_data.get("email"),
            "country": student_data.get("country", "Unknown"),
            "phone": student_data.get("phone"),
            "grade": student_data.get("grade"),
            "source": student_data.get("source"),
            "additional_data": student_data.get("additionalData"),
            "created_at": student_data.get("createdAt", datetime.utcnow()),
            
            # Profile data (mutable)
            "status": student_data.get("status", "Exploring"),
            "last_active": student_data.get("lastActive", datetime.utcnow()),
            "last_contacted_at": student_data.get("lastContactedAt"),
            "high_intent": student_data.get("highIntent", False),
            "needs_essay_help": student_data.get("needsEssayHelp", False)
        }
        
        # Create the new student document
        db.collection("students_v2").document(student_id).set(new_student_data)
        
        # Migrate timeline events if they exist
        migrate_timeline_events(db, student_id, student_data)
        
        migrated_count += 1
    
    print(f"✅ Migration completed! Migrated {migrated_count} students")
    return migrated_count

def migrate_timeline_events(db, student_id, student_data):
    """Migrate timeline events to subcollections"""
    timeline_ref = db.collection("students_v2").document(student_id).collection("timeline")
    
    # Migrate interactions if they exist
    if "interactions" in student_data:
        for interaction in student_data["interactions"]:
            interaction_data = {
                "type": "interaction",
                "student_id": student_id,
                "created_at": interaction.get("createdAt", datetime.utcnow()),
                "created_by": interaction.get("createdBy", "CRM Team"),
                "interaction_type": interaction.get("type", "other"),
                "description": interaction.get("description", ""),
                "outcome": interaction.get("outcome"),
                "follow_up_required": interaction.get("followUpRequired", False),
                "follow_up_date": interaction.get("followUpDate")
            }
            timeline_ref.add(interaction_data)
    
    # Migrate communications if they exist
    if "communications" in student_data:
        for communication in student_data["communications"]:
            communication_data = {
                "type": "communication",
                "student_id": student_id,
                "created_at": communication.get("createdAt", datetime.utcnow()),
                "created_by": communication.get("createdBy", "CRM Team"),
                "communication_type": communication.get("type", "email"),
                "subject": communication.get("subject"),
                "content": communication.get("content", ""),
                "direction": communication.get("direction", "outbound"),
                "status": communication.get("status", "sent")
            }
            timeline_ref.add(communication_data)
    
    # Migrate notes if they exist
    if "notes" in student_data:
        for note in student_data["notes"]:
            note_data = {
                "type": "note",
                "student_id": student_id,
                "created_at": note.get("createdAt", datetime.utcnow()),
                "created_by": note.get("createdBy", "CRM Team"),
                "title": note.get("title", "Note"),
                "content": note.get("content", ""),
                "is_private": note.get("isPrivate", True)
            }
            timeline_ref.add(note_data)
    
    # Migrate tasks if they exist
    if "tasks" in student_data:
        for task in student_data["tasks"]:
            task_data = {
                "type": "task",
                "student_id": student_id,
                "created_at": task.get("createdAt", datetime.utcnow()),
                "created_by": task.get("createdBy", "CRM Team"),
                "title": task.get("title", "Task"),
                "description": task.get("description", ""),
                "due_date": task.get("dueDate"),
                "status": task.get("status", "pending"),
                "priority": task.get("priority", "medium")
            }
            timeline_ref.add(task_data)
    
    # Migrate reminders if they exist
    if "reminders" in student_data:
        for reminder in student_data["reminders"]:
            reminder_data = {
                "type": "reminder",
                "student_id": student_id,
                "created_at": reminder.get("createdAt", datetime.utcnow()),
                "created_by": reminder.get("createdBy", "CRM Team"),
                "title": reminder.get("title", "Reminder"),
                "description": reminder.get("description", ""),
                "reminder_date": reminder.get("reminderDate"),
                "status": reminder.get("status", "pending")
            }
            timeline_ref.add(reminder_data)

def verify_migration():
    """Verify the migration was successful"""
    db = init_firebase()
    
    print("🔍 Verifying migration...")
    
    # Check students_v2 collection
    students_v2 = list(db.collection("students_v2").stream())
    print(f"📊 Found {len(students_v2)} students in students_v2 collection")
    
    # Check timeline events
    total_events = 0
    for student_doc in students_v2:
        events = list(db.collection("students_v2").document(student_doc.id).collection("timeline").stream())
        total_events += len(events)
        if len(events) > 0:
            print(f"  📅 Student {student_doc.id}: {len(events)} timeline events")
    
    print(f"📊 Total timeline events: {total_events}")
    print("✅ Migration verification completed!")

if __name__ == "__main__":
    load_dotenv()
    
    print("🚀 Starting migration to subcollection structure...")
    print("This will create a new 'students_v2' collection with the improved structure")
    print()
    
    # Run migration
    migrated_count = migrate_students()
    
    # Verify migration
    verify_migration()
    
    print()
    print("🎉 Migration completed successfully!")
    print("Next steps:")
    print("1. Test the new API endpoints")
    print("2. Update frontend to use new structure")
    print("3. Once confirmed working, delete old collections")
