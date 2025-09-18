"""
Student service for business logic and data operations
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import csv
import io
from app.models.student import (
    Student, StudentCreate, StudentUpdate, StudentSearchRequest,
    StudentSearchResponse, StudentBulkImport, StudentBulkImportResult,
    StudentAnalyticsRequest, StudentAnalyticsResponse, StudentExportRequest
)
from app.core.database import get_firestore

class StudentService:
    def __init__(self, db):
        self.db = db
        self.collection = "students"

    async def get_students(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[str] = None,
        country: Optional[str] = None,
        high_intent: Optional[bool] = None,
        needs_essay_help: Optional[bool] = None
    ) -> List[Student]:
        """Get students with optional filtering"""
        try:
            query = self.db.collection(self.collection)
            
            # Apply filters
            if status:
                query = query.where("status", "==", status)
            if country:
                query = query.where("country", "==", country)
            if high_intent is not None:
                query = query.where("highIntent", "==", high_intent)
            if needs_essay_help is not None:
                query = query.where("needsEssayHelp", "==", needs_essay_help)
            
            # Apply pagination
            query = query.offset(skip).limit(limit)
            
            docs = query.stream()
            students = []
            
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                students.append(self._doc_to_student(data))
            
            return students
        except Exception as e:
            raise Exception(f"Failed to get students: {str(e)}")

    async def get_student(self, student_id: str) -> Optional[Student]:
        """Get a specific student by ID"""
        try:
            doc = self.db.collection(self.collection).document(student_id).get()
            if not doc.exists:
                return None
            
            data = doc.to_dict()
            data["id"] = doc.id
            return self._doc_to_student(data)
        except Exception as e:
            raise Exception(f"Failed to get student: {str(e)}")

    async def create_student(self, student_data: StudentCreate) -> Student:
        """Create a new student"""
        try:
            # Check for duplicate email
            existing_query = self.db.collection(self.collection).where("email", "==", student_data.email)
            existing_docs = existing_query.get()
            
            if existing_docs:
                raise ValueError("Student with this email already exists")
            
            # Prepare data for Firestore
            now = datetime.utcnow()
            firestore_data = {
                "name": student_data.name,
                "email": student_data.email,
                "phone": student_data.phone,
                "grade": student_data.grade,
                "country": student_data.country,
                "status": student_data.status.value,
                "highIntent": student_data.high_intent,
                "needsEssayHelp": student_data.needs_essay_help,
                "source": student_data.source,
                "additionalData": student_data.additional_data,
                "createdAt": now,
                "lastActive": now,
                "lastContactedAt": None
            }
            
            # Add to Firestore
            doc_ref = self.db.collection(self.collection).add(firestore_data)
            student_id = doc_ref[1].id
            
            # Return the created student
            firestore_data["id"] = student_id
            return self._doc_to_student(firestore_data)
        except ValueError:
            raise
        except Exception as e:
            raise Exception(f"Failed to create student: {str(e)}")

    async def update_student(self, student_id: str, student_update: StudentUpdate) -> Optional[Student]:
        """Update a student"""
        try:
            doc_ref = self.db.collection(self.collection).document(student_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return None
            
            # Prepare update data
            update_data = {}
            if student_update.name is not None:
                update_data["name"] = student_update.name
            if student_update.email is not None:
                update_data["email"] = student_update.email
            if student_update.phone is not None:
                update_data["phone"] = student_update.phone
            if student_update.grade is not None:
                update_data["grade"] = student_update.grade
            if student_update.country is not None:
                update_data["country"] = student_update.country
            if student_update.status is not None:
                update_data["status"] = student_update.status.value
            if student_update.high_intent is not None:
                update_data["highIntent"] = student_update.high_intent
            if student_update.needs_essay_help is not None:
                update_data["needsEssayHelp"] = student_update.needs_essay_help
            if student_update.source is not None:
                update_data["source"] = student_update.source
            if student_update.additional_data is not None:
                update_data["additionalData"] = student_update.additional_data
            
            update_data["lastActive"] = datetime.utcnow()
            
            # Update in Firestore
            doc_ref.update(update_data)
            
            # Return updated student
            updated_doc = doc_ref.get()
            data = updated_doc.to_dict()
            data["id"] = student_id
            return self._doc_to_student(data)
        except Exception as e:
            raise Exception(f"Failed to update student: {str(e)}")

    async def delete_student(self, student_id: str) -> bool:
        """Delete a student"""
        try:
            doc_ref = self.db.collection(self.collection).document(student_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return False
            
            doc_ref.delete()
            return True
        except Exception as e:
            raise Exception(f"Failed to delete student: {str(e)}")

    async def search_students(self, search_request: StudentSearchRequest) -> StudentSearchResponse:
        """Search students with various filters"""
        try:
            query = self.db.collection(self.collection)
            
            # Apply text search (simplified - in production, use Algolia or similar)
            search_query = search_request.query.lower()
            
            # Get all students and filter in memory (not ideal for large datasets)
            docs = query.stream()
            all_students = []
            
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                student = self._doc_to_student(data)
                
                # Text search
                if (search_query in student.name.lower() or 
                    search_query in student.email.lower() or 
                    search_query in student.country.lower()):
                    all_students.append(student)
            
            # Apply additional filters
            filtered_students = []
            for student in all_students:
                if search_request.status_filter and student.status != search_request.status_filter:
                    continue
                if search_request.country_filter and search_request.country_filter.lower() not in student.country.lower():
                    continue
                if search_request.high_intent_only and not student.high_intent:
                    continue
                if search_request.needs_essay_help_only and not student.needs_essay_help:
                    continue
                if search_request.not_contacted_7_days:
                    if student.last_contacted_at:
                        days_since_contact = (datetime.utcnow() - student.last_contacted_at).days
                        if days_since_contact <= 7:
                            continue
                
                filtered_students.append(student)
            
            # Apply pagination
            total = len(filtered_students)
            start_idx = search_request.offset
            end_idx = start_idx + search_request.limit
            paginated_students = filtered_students[start_idx:end_idx]
            
            return StudentSearchResponse(
                students=paginated_students,
                total=total,
                page=search_request.offset // search_request.limit + 1,
                limit=search_request.limit,
                has_more=end_idx < total
            )
        except Exception as e:
            raise Exception(f"Failed to search students: {str(e)}")

    async def bulk_import_students(self, import_request: StudentBulkImport) -> StudentBulkImportResult:
        """Bulk import students"""
        try:
            imported = 0
            failed = 0
            errors = []
            
            for i, student_data in enumerate(import_request.students):
                try:
                    if not import_request.validate_only:
                        await self.create_student(student_data)
                    imported += 1
                except Exception as e:
                    failed += 1
                    errors.append({
                        "row": i + 1,
                        "email": student_data.email,
                        "error": str(e)
                    })
            
            return StudentBulkImportResult(
                success=failed == 0,
                imported=imported,
                failed=failed,
                errors=errors,
                summary={
                    "total": len(import_request.students),
                    "imported": imported,
                    "skipped": 0,  # We don't skip duplicates in this implementation
                    "validationErrors": failed
                }
            )
        except Exception as e:
            raise Exception(f"Failed to bulk import students: {str(e)}")

    async def export_students(self, export_request: StudentExportRequest) -> tuple:
        """Export students in specified format"""
        try:
            # Get all students
            students = await self.get_students(limit=10000)  # Large limit for export
            
            if export_request.format == "json":
                # Export as JSON
                students_data = [student.dict() for student in students]
                file_data = json.dumps(students_data, indent=2, default=str)
                content_type = "application/json"
                filename = "students_export.json"
            else:  # CSV
                # Export as CSV
                output = io.StringIO()
                if students:
                    fieldnames = students[0].dict().keys()
                    writer = csv.DictWriter(output, fieldnames=fieldnames)
                    writer.writeheader()
                    for student in students:
                        writer.writerow(student.dict())
                file_data = output.getvalue()
                content_type = "text/csv"
                filename = "students_export.csv"
            
            return file_data, content_type, filename
        except Exception as e:
            raise Exception(f"Failed to export students: {str(e)}")

    async def get_analytics(self, analytics_request: StudentAnalyticsRequest) -> StudentAnalyticsResponse:
        """Get student analytics"""
        try:
            # Get all students
            students = await self.get_students(limit=10000)
            
            # Calculate date range
            cutoff_date = datetime.utcnow() - timedelta(days=analytics_request.date_range_days)
            
            # Filter students by date range
            recent_students = [s for s in students if s.created_at >= cutoff_date]
            
            # Overview metrics
            overview = {
                "totalStudents": len(students),
                "newStudents": len(recent_students),
                "highIntentStudents": len([s for s in students if s.high_intent]),
                "needsEssayHelpStudents": len([s for s in students if s.needs_essay_help])
            }
            
            # Status breakdown
            status_breakdown = {}
            for student in students:
                status = student.status.value
                status_breakdown[status] = status_breakdown.get(status, 0) + 1
            
            # Country breakdown
            country_breakdown = {}
            for student in students:
                country = student.country
                country_breakdown[country] = country_breakdown.get(country, 0) + 1
            
            # Engagement metrics
            engagement_metrics = {
                "avgDaysSinceLastContact": 0,  # Calculate this
                "studentsNotContacted7Days": len([s for s in students if not s.last_contacted_at or (datetime.utcnow() - s.last_contacted_at).days > 7])
            }
            
            # Trends (simplified)
            trends = {
                "newStudentsThisWeek": len([s for s in recent_students if s.created_at >= datetime.utcnow() - timedelta(days=7)]),
                "newStudentsThisMonth": len([s for s in recent_students if s.created_at >= datetime.utcnow() - timedelta(days=30)])
            }
            
            return StudentAnalyticsResponse(
                overview=overview,
                status_breakdown=status_breakdown,
                country_breakdown=country_breakdown,
                engagement_metrics=engagement_metrics,
                trends=trends
            )
        except Exception as e:
            raise Exception(f"Failed to get analytics: {str(e)}")

    async def validate_student_data(self, student_data: StudentCreate) -> Dict[str, Any]:
        """Validate student data"""
        errors = []
        warnings = []
        
        # Basic validation
        if not student_data.name or len(student_data.name.strip()) == 0:
            errors.append("Name is required")
        
        if not student_data.email or "@" not in student_data.email:
            errors.append("Valid email is required")
        
        if not student_data.country or len(student_data.country.strip()) == 0:
            errors.append("Country is required")
        
        # Check for duplicate email
        try:
            existing_query = self.db.collection(self.collection).where("email", "==", student_data.email)
            existing_docs = existing_query.get()
            if existing_docs:
                errors.append("Student with this email already exists")
        except:
            warnings.append("Could not check for duplicate email")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

    def _doc_to_student(self, data: Dict[str, Any]) -> Student:
        """Convert Firestore document to Student model"""
        return Student(
            id=data["id"],
            name=data["name"],
            email=data["email"],
            phone=data.get("phone"),
            grade=data.get("grade"),
            country=data["country"],
            status=data["status"],
            high_intent=data.get("highIntent", False),
            needs_essay_help=data.get("needsEssayHelp", False),
            source=data.get("source"),
            additional_data=data.get("additionalData"),
            created_at=data["createdAt"],
            last_active=data["lastActive"],
            last_contacted_at=data.get("lastContactedAt")
        )
