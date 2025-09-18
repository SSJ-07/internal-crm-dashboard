"""
Student management endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.models.student import (
    Student, StudentCreate, StudentUpdate, StudentSearchRequest, 
    StudentSearchResponse, StudentBulkImport, StudentBulkImportResult,
    StudentAnalyticsRequest, StudentAnalyticsResponse, StudentExportRequest
)
from app.core.auth import verify_firebase_token
from app.services.student_service import StudentService
from app.core.database import get_firestore

router = APIRouter()

@router.get("/", response_model=List[Student])
async def get_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    country: Optional[str] = None,
    high_intent: Optional[bool] = None,
    needs_essay_help: Optional[bool] = None,
    current_user: dict = Depends(verify_firebase_token)
):
    """Get all students with optional filtering"""
    try:
        service = StudentService(get_firestore())
        students = await service.get_students(
            skip=skip, limit=limit, status=status, country=country,
            high_intent=high_intent, needs_essay_help=needs_essay_help
        )
        return students
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{student_id}", response_model=Student)
async def get_student(
    student_id: str,
    current_user: dict = Depends(verify_firebase_token)
):
    """Get a specific student by ID"""
    try:
        service = StudentService(get_firestore())
        student = await service.get_student(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        return student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Student)
async def create_student(
    student: StudentCreate,
    current_user: dict = Depends(verify_firebase_token)
):
    """Create a new student"""
    try:
        service = StudentService(get_firestore())
        new_student = await service.create_student(student)
        return new_student
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{student_id}", response_model=Student)
async def update_student(
    student_id: str,
    student_update: StudentUpdate,
    current_user: dict = Depends(verify_firebase_token)
):
    """Update a student"""
    try:
        service = StudentService(get_firestore())
        updated_student = await service.update_student(student_id, student_update)
        if not updated_student:
            raise HTTPException(status_code=404, detail="Student not found")
        return updated_student
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    current_user: dict = Depends(verify_firebase_token)
):
    """Delete a student"""
    try:
        service = StudentService(get_firestore())
        success = await service.delete_student(student_id)
        if not success:
            raise HTTPException(status_code=404, detail="Student not found")
        return {"message": "Student deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=StudentSearchResponse)
async def search_students(
    search_request: StudentSearchRequest,
    current_user: dict = Depends(verify_firebase_token)
):
    """Search students with various filters"""
    try:
        service = StudentService(get_firestore())
        result = await service.search_students(search_request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk/import", response_model=StudentBulkImportResult)
async def bulk_import_students(
    import_request: StudentBulkImport,
    current_user: dict = Depends(verify_firebase_token)
):
    """Bulk import students from JSON data"""
    try:
        service = StudentService(get_firestore())
        result = await service.bulk_import_students(import_request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk/export")
async def bulk_export_students(
    export_request: StudentExportRequest,
    current_user: dict = Depends(verify_firebase_token)
):
    """Export students in CSV or JSON format"""
    try:
        service = StudentService(get_firestore())
        file_data, content_type, filename = await service.export_students(export_request)
        return {
            "file_data": file_data,
            "content_type": content_type,
            "filename": filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analytics", response_model=StudentAnalyticsResponse)
async def get_student_analytics(
    analytics_request: StudentAnalyticsRequest,
    current_user: dict = Depends(verify_firebase_token)
):
    """Get student analytics and insights"""
    try:
        service = StudentService(get_firestore())
        analytics = await service.get_analytics(analytics_request)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/register")
async def register_student(
    student: StudentCreate,
    current_user: dict = Depends(verify_firebase_token)
):
    """Register a new student (public endpoint for website registration)"""
    try:
        service = StudentService(get_firestore())
        new_student = await service.create_student(student)
        return {
            "success": True,
            "student_id": new_student.id,
            "message": "Student registered successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate")
async def validate_student_data(
    student: StudentCreate,
    current_user: dict = Depends(verify_firebase_token)
):
    """Validate student data without creating the student"""
    try:
        service = StudentService(get_firestore())
        validation_result = await service.validate_student_data(student)
        return validation_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
