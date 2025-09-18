"""
Improved student service using subcollections for timeline events
"""
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from google.cloud import firestore
from app.models.student_v2 import (
    Student, StudentCreate, StudentUpdate,
    Interaction, InteractionCreate,
    Communication, CommunicationCreate,
    Note, NoteCreate,
    Task, TaskCreate,
    Reminder, ReminderCreate,
    TimelineEventType
)

class StudentV2Service:
    def __init__(self, db: firestore.Client):
        self.db = db
        self.students_collection = "students"

    # Student CRUD operations
    async def get_student(self, student_id: str) -> Optional[Student]:
        """Get student by ID"""
        try:
            doc_ref = self.db.collection(self.students_collection).document(student_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return None
            
            data = doc.to_dict()
            data["id"] = student_id
            return self._doc_to_student(data)
        except Exception as e:
            print(f"Error getting student: {e}")
            return None

    async def get_students(self, skip: int = 0, limit: int = 100) -> List[Student]:
        """Get all students"""
        try:
            docs = self.db.collection(self.students_collection).offset(skip).limit(limit).stream()
            students = []
            
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                student = self._doc_to_student(data)
                students.append(student)
            
            return students
        except Exception as e:
            print(f"Error getting students: {e}")
            return []

    async def create_student(self, student_data: StudentCreate) -> Student:
        """Create a new student"""
        try:
            # Check if student with this email already exists
            existing_docs = list(self.db.collection(self.students_collection)
                               .where("email", "==", student_data.email)
                               .stream())
            if existing_docs:
                raise ValueError("Student with this email already exists")
            
            # Prepare data for Firestore
            now = datetime.utcnow()
            firestore_data = {
                # Core identity
                "name": student_data.name,
                "email": student_data.email,
                "country": student_data.country,
                "phone": student_data.phone,
                "grade": student_data.grade,
                "source": student_data.source,
                "additional_data": student_data.additional_data,
                "created_at": now,
                # Profile data
                "status": student_data.status.value,
                "last_active": now,
                "last_contacted_at": None,
                "high_intent": student_data.high_intent,
                "needs_essay_help": student_data.needs_essay_help
            }
            
            # Add to Firestore
            doc_ref = self.db.collection(self.students_collection).add(firestore_data)
            student_id = doc_ref[1].id
            
            # Return the created student
            firestore_data["id"] = student_id
            return self._doc_to_student(firestore_data)
        except ValueError:
            raise
        except Exception as e:
            raise Exception(f"Failed to create student: {str(e)}")

    async def update_student(self, student_id: str, student_update: StudentUpdate) -> Optional[Student]:
        """Update student - only profile fields can be updated"""
        try:
            doc_ref = self.db.collection(self.students_collection).document(student_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return None
            
            # Prepare update data - only profile fields can be updated
            update_data = {}
            if student_update.status is not None:
                update_data["status"] = student_update.status.value
            if student_update.last_active is not None:
                update_data["last_active"] = student_update.last_active
            if student_update.last_contacted_at is not None:
                update_data["last_contacted_at"] = student_update.last_contacted_at
            if student_update.high_intent is not None:
                update_data["high_intent"] = student_update.high_intent
            if student_update.needs_essay_help is not None:
                update_data["needs_essay_help"] = student_update.needs_essay_help
            if student_update.additional_data is not None:
                update_data["additional_data"] = student_update.additional_data
            
            if not update_data:
                # No fields to update
                return await self.get_student(student_id)
            
            # Update in Firestore
            doc_ref.update(update_data)
            
            # Return updated student
            return await self.get_student(student_id)
        except Exception as e:
            raise Exception(f"Failed to update student: {str(e)}")

    async def delete_student(self, student_id: str) -> bool:
        """Delete student and all timeline events"""
        try:
            # Delete all timeline events first
            timeline_ref = self.db.collection(self.students_collection).document(student_id).collection("timeline")
            timeline_docs = timeline_ref.stream()
            for doc in timeline_docs:
                doc.reference.delete()
            
            # Delete student document
            doc_ref = self.db.collection(self.students_collection).document(student_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return False
            
            doc_ref.delete()
            return True
        except Exception as e:
            raise Exception(f"Failed to delete student: {str(e)}")

    # Timeline events operations
    async def get_timeline_events(self, student_id: str, event_type: Optional[TimelineEventType] = None) -> List[Union[Interaction, Communication, Note, Task, Reminder]]:
        """Get timeline events for a student"""
        try:
            timeline_ref = self.db.collection(self.students_collection).document(student_id).collection("timeline")
            
            if event_type:
                timeline_ref = timeline_ref.where("type", "==", event_type.value)
            
            docs = timeline_ref.order_by("created_at", direction=firestore.Query.DESCENDING).stream()
            events = []
            
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                data["student_id"] = student_id
                
                event_type = data.get("type")
                if event_type == "interaction":
                    events.append(self._doc_to_interaction(data))
                elif event_type == "communication":
                    events.append(self._doc_to_communication(data))
                elif event_type == "note":
                    events.append(self._doc_to_note(data))
                elif event_type == "task":
                    events.append(self._doc_to_task(data))
                elif event_type == "reminder":
                    events.append(self._doc_to_reminder(data))
            
            return events
        except Exception as e:
            print(f"Error getting timeline events: {e}")
            return []

    async def create_interaction(self, student_id: str, interaction_data: InteractionCreate) -> Interaction:
        """Create an interaction event"""
        try:
            now = datetime.utcnow()
            firestore_data = {
                "type": "interaction",
                "student_id": student_id,
                "created_at": now,
                "created_by": "CRM Team",
                "interaction_type": interaction_data.interaction_type,
                "description": interaction_data.description,
                "outcome": interaction_data.outcome,
                "follow_up_required": interaction_data.follow_up_required,
                "follow_up_date": interaction_data.follow_up_date
            }
            
            doc_ref = self.db.collection(self.students_collection).document(student_id).collection("timeline").add(firestore_data)
            interaction_id = doc_ref[1].id
            
            firestore_data["id"] = interaction_id
            return self._doc_to_interaction(firestore_data)
        except Exception as e:
            raise Exception(f"Failed to create interaction: {str(e)}")

    async def create_communication(self, student_id: str, communication_data: CommunicationCreate) -> Communication:
        """Create a communication event"""
        try:
            now = datetime.utcnow()
            firestore_data = {
                "type": "communication",
                "student_id": student_id,
                "created_at": now,
                "created_by": "CRM Team",
                "communication_type": communication_data.communication_type,
                "subject": communication_data.subject,
                "content": communication_data.content,
                "direction": communication_data.direction,
                "status": communication_data.status
            }
            
            doc_ref = self.db.collection(self.students_collection).document(student_id).collection("timeline").add(firestore_data)
            communication_id = doc_ref[1].id
            
            firestore_data["id"] = communication_id
            return self._doc_to_communication(firestore_data)
        except Exception as e:
            raise Exception(f"Failed to create communication: {str(e)}")

    async def create_note(self, student_id: str, note_data: NoteCreate) -> Note:
        """Create a note event"""
        try:
            now = datetime.utcnow()
            firestore_data = {
                "type": "note",
                "student_id": student_id,
                "created_at": now,
                "created_by": "CRM Team",
                "title": note_data.title,
                "content": note_data.content,
                "is_private": note_data.is_private
            }
            
            doc_ref = self.db.collection(self.students_collection).document(student_id).collection("timeline").add(firestore_data)
            note_id = doc_ref[1].id
            
            firestore_data["id"] = note_id
            return self._doc_to_note(firestore_data)
        except Exception as e:
            raise Exception(f"Failed to create note: {str(e)}")

    async def create_task(self, student_id: str, task_data: TaskCreate) -> Task:
        """Create a task event"""
        try:
            now = datetime.utcnow()
            firestore_data = {
                "type": "task",
                "student_id": student_id,
                "created_at": now,
                "created_by": "CRM Team",
                "title": task_data.title,
                "description": task_data.description,
                "due_date": task_data.due_date,
                "status": task_data.status,
                "priority": task_data.priority
            }
            
            doc_ref = self.db.collection(self.students_collection).document(student_id).collection("timeline").add(firestore_data)
            task_id = doc_ref[1].id
            
            firestore_data["id"] = task_id
            return self._doc_to_task(firestore_data)
        except Exception as e:
            raise Exception(f"Failed to create task: {str(e)}")

    async def create_reminder(self, student_id: str, reminder_data: ReminderCreate) -> Reminder:
        """Create a reminder event"""
        try:
            now = datetime.utcnow()
            firestore_data = {
                "type": "reminder",
                "student_id": student_id,
                "created_at": now,
                "created_by": "CRM Team",
                "title": reminder_data.title,
                "description": reminder_data.description,
                "reminder_date": reminder_data.reminder_date,
                "status": reminder_data.status
            }
            
            doc_ref = self.db.collection(self.students_collection).document(student_id).collection("timeline").add(firestore_data)
            reminder_id = doc_ref[1].id
            
            firestore_data["id"] = reminder_id
            return self._doc_to_reminder(firestore_data)
        except Exception as e:
            raise Exception(f"Failed to create reminder: {str(e)}")

    # Helper methods
    def _doc_to_student(self, data: Dict[str, Any]) -> Student:
        """Convert Firestore document to Student model"""
        from app.models.student_v2 import StudentStatus
        from datetime import datetime
        
        # Handle both old and new data formats
        created_at = data.get("created_at") or data.get("createdAt", datetime.utcnow())
        last_active = data.get("last_active") or data.get("lastActive", datetime.utcnow())
        last_contacted_at = data.get("last_contacted_at") or data.get("lastContactedAt")
        high_intent = data.get("high_intent")
        if high_intent is None:
            high_intent = data.get("highIntent")
        if high_intent is None:
            high_intent = False
        
        needs_essay_help = data.get("needs_essay_help")
        if needs_essay_help is None:
            needs_essay_help = data.get("needsEssayHelp")
        if needs_essay_help is None:
            needs_essay_help = False
        additional_data = data.get("additional_data") or data.get("additionalData")
        
        return Student(
            id=data["id"],
            name=data.get("name") or "Unknown Student",
            email=data.get("email") or "unknown@example.com",
            country=data.get("country") or "Unknown",
            phone=data.get("phone"),
            grade=data.get("grade"),
            source=data.get("source"),
            additional_data=additional_data,
            created_at=created_at,
            status=StudentStatus(data.get("status") or "Exploring"),
            last_active=last_active,
            last_contacted_at=last_contacted_at,
            high_intent=high_intent,
            needs_essay_help=needs_essay_help
        )

    def _doc_to_interaction(self, data: Dict[str, Any]) -> Interaction:
        """Convert Firestore document to Interaction model"""
        return Interaction(
            id=data["id"],
            student_id=data["student_id"],
            type=TimelineEventType.INTERACTION,
            created_at=data["created_at"],
            created_by=data["created_by"],
            interaction_type=data["interaction_type"],
            description=data["description"],
            outcome=data.get("outcome"),
            follow_up_required=data.get("follow_up_required", False),
            follow_up_date=data.get("follow_up_date")
        )

    def _doc_to_communication(self, data: Dict[str, Any]) -> Communication:
        """Convert Firestore document to Communication model"""
        return Communication(
            id=data["id"],
            student_id=data["student_id"],
            type=TimelineEventType.COMMUNICATION,
            created_at=data["created_at"],
            created_by=data["created_by"],
            communication_type=data["communication_type"],
            subject=data.get("subject"),
            content=data["content"],
            direction=data["direction"],
            status=data["status"]
        )

    def _doc_to_note(self, data: Dict[str, Any]) -> Note:
        """Convert Firestore document to Note model"""
        return Note(
            id=data["id"],
            student_id=data["student_id"],
            type=TimelineEventType.NOTE,
            created_at=data["created_at"],
            created_by=data["created_by"],
            title=data["title"],
            content=data["content"],
            is_private=data.get("is_private", True)
        )

    def _doc_to_task(self, data: Dict[str, Any]) -> Task:
        """Convert Firestore document to Task model"""
        # Handle both old and new field names
        created_at = data.get("created_at") or data.get("createdAt")
        created_by = data.get("created_by") or data.get("createdBy", "Unknown")
        due_date = data.get("due_date") or data.get("due")
        student_id = data.get("student_id") or data.get("studentId", "standalone")
        student_name = data.get("student_name") or data.get("studentName")
        
        return Task(
            id=data["id"],
            student_id=student_id,
            type=TimelineEventType.TASK,
            created_at=created_at,
            created_by=created_by,
            title=data["title"],
            description=data.get("description", ""),
            due_date=due_date,
            status=data["status"],
            priority=data.get("priority", "medium"),
            student_name=student_name
        )

    def _doc_to_reminder(self, data: Dict[str, Any]) -> Reminder:
        """Convert Firestore document to Reminder model"""
        return Reminder(
            id=data["id"],
            student_id=data["student_id"],
            type=TimelineEventType.REMINDER,
            created_at=data["created_at"],
            created_by=data["created_by"],
            title=data["title"],
            description=data["description"],
            reminder_date=data["reminder_date"],
            status=data["status"]
        )

    # Standalone reminders methods
    async def get_all_reminders(self) -> List[Reminder]:
        """Get all standalone reminders"""
        try:
            docs = self.db.collection("reminders").stream()
            reminders = []
            
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                data["student_id"] = "standalone"  # Standalone reminders don't belong to a specific student
                reminders.append(self._doc_to_reminder(data))
            
            return reminders
        except Exception as e:
            print(f"Error getting reminders: {e}")
            return []

    async def create_standalone_reminder(self, reminder_data: ReminderCreate) -> Reminder:
        """Create a standalone reminder"""
        try:
            now = datetime.utcnow()
            firestore_data = {
                "title": reminder_data.title,
                "description": reminder_data.description,
                "reminder_date": reminder_data.reminder_date,
                "status": reminder_data.status,
                "created_at": now,
                "created_by": "CRM Team"
            }
            
            doc_ref = self.db.collection("reminders").add(firestore_data)
            reminder_id = doc_ref[1].id
            
            firestore_data["id"] = reminder_id
            firestore_data["student_id"] = "standalone"
            return self._doc_to_reminder(firestore_data)
        except Exception as e:
            raise Exception(f"Failed to create standalone reminder: {str(e)}")

    # Dashboard methods
    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get dashboard statistics"""
        try:
            # Get all students
            students = await self.get_students()
            
            # Get all reminders
            reminders = await self.get_all_reminders()
            
            # Calculate stats
            total_students = len(students)
            status_counts = {}
            country_counts = {}
            high_intent_count = 0
            needs_essay_help_count = 0
            
            for student in students:
                # Status counts
                status = student.status.value
                status_counts[status] = status_counts.get(status, 0) + 1
                
                # Country counts
                country = student.country
                country_counts[country] = country_counts.get(country, 0) + 1
                
                # Feature counts
                if student.high_intent:
                    high_intent_count += 1
                if student.needs_essay_help:
                    needs_essay_help_count += 1
            
            # Reminder stats
            today = datetime.utcnow().date()
            upcoming_reminders = []
            overdue_reminders = []
            
            for reminder in reminders:
                reminder_date = reminder.reminder_date.date() if hasattr(reminder.reminder_date, 'date') else reminder.reminder_date
                if reminder_date >= today:
                    upcoming_reminders.append(reminder)
                else:
                    overdue_reminders.append(reminder)
            
            return {
                "total_students": total_students,
                "status_breakdown": status_counts,
                "country_breakdown": country_counts,
                "high_intent_count": high_intent_count,
                "needs_essay_help_count": needs_essay_help_count,
                "upcoming_reminders": len(upcoming_reminders),
                "overdue_reminders": len(overdue_reminders),
                "total_reminders": len(reminders)
            }
        except Exception as e:
            raise Exception(f"Failed to get dashboard stats: {str(e)}")

    # Tasks methods
    async def get_all_tasks(self) -> List[Task]:
        """Get all standalone tasks"""
        try:
            docs = self.db.collection("tasks").stream()
            tasks = []
            
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                data["student_id"] = "standalone"  # Standalone tasks don't belong to a specific student
                tasks.append(self._doc_to_task(data))
            
            return tasks
        except Exception as e:
            print(f"Error getting tasks: {e}")
            return []

    async def create_standalone_task(self, task_data: TaskCreate) -> Task:
        """Create a standalone task"""
        try:
            now = datetime.utcnow()
            firestore_data = {
                "title": task_data.title,
                "description": task_data.description,
                "due_date": task_data.due_date,
                "status": task_data.status,
                "priority": task_data.priority,
                "created_at": now,
                "created_by": "CRM Team"
            }
            
            # Add student information if provided
            if hasattr(task_data, 'student_id') and task_data.student_id:
                firestore_data["student_id"] = task_data.student_id
            else:
                firestore_data["student_id"] = "standalone"
                
            if hasattr(task_data, 'student_name') and task_data.student_name:
                firestore_data["student_name"] = task_data.student_name
            
            doc_ref = self.db.collection("tasks").add(firestore_data)
            task_id = doc_ref[1].id
            
            firestore_data["id"] = task_id
            return self._doc_to_task(firestore_data)
        except Exception as e:
            raise Exception(f"Failed to create standalone task: {str(e)}")

    async def update_task(self, task_id: str, update_data: dict) -> Task:
        """Update a task"""
        try:
            task_ref = self.db.collection("tasks").document(task_id)
            
            # Convert camelCase to snake_case for Firestore
            firestore_data = {}
            for key, value in update_data.items():
                if key == "due":
                    firestore_data["due_date"] = value
                elif key == "studentId":
                    firestore_data["student_id"] = value
                elif key == "studentName":
                    firestore_data["student_name"] = value
                elif key == "deletedAt":
                    firestore_data["deleted_at"] = value
                elif key == "deletedBy":
                    firestore_data["deleted_by"] = value
                else:
                    firestore_data[key] = value
            
            task_ref.update(firestore_data)
            
            # Get updated task
            updated_doc = task_ref.get()
            if updated_doc.exists:
                data = updated_doc.to_dict()
                data["id"] = task_id
                data["student_id"] = "standalone"
                return self._doc_to_task(data)
            else:
                raise Exception("Task not found after update")
        except Exception as e:
            raise Exception(f"Failed to update task: {str(e)}")

    async def delete_task(self, task_id: str) -> None:
        """Permanently delete a task"""
        try:
            self.db.collection("tasks").document(task_id).delete()
        except Exception as e:
            raise Exception(f"Failed to delete task: {str(e)}")
