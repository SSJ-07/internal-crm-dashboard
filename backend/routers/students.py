from fastapi import APIRouter, HTTPException, Depends
from firebase_admin import firestore
from firebase_config import db
from auth_dependency import verify_admin

router = APIRouter(prefix="/api/students", tags=["students"])

@router.get("/")
def list_students(current_user: dict = Depends(verify_admin)):
    """Get all students - admin only"""
    try:
        students_ref = db.collection("students").stream()
        students = []
        for doc in students_ref:
            student_data = doc.to_dict()
            student_data["id"] = doc.id
            students.append(student_data)
        
        print(f"✅ Found {len(students)} students for admin: {current_user['email']}")
        return {"students": students}
    except Exception as e:
        print(f"❌ Error fetching students: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{student_id}")
def get_student(student_id: str, current_user: dict = Depends(verify_admin)):
    """Get a specific student - admin only"""
    try:
        doc_ref = db.collection("students").document(student_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Student not found")
        
        student_data = doc.to_dict()
        student_data["id"] = doc.id
        return student_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching student {student_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def add_student(student_data: dict, current_user: dict = Depends(verify_admin)):
    """Add a new student - admin only"""
    try:
        # Set lastActive timestamp
        student_data["last_active"] = firestore.SERVER_TIMESTAMP
        student_data["created_at"] = firestore.SERVER_TIMESTAMP
        
        doc_ref = db.collection("students").document()
        doc_ref.set(student_data, merge=True)
        
        result = student_data.copy()
        result["id"] = doc_ref.id
        
        print(f"✅ Added student {student_data.get('name', 'Unknown')} by admin: {current_user['email']}")
        return result
    except Exception as e:
        print(f"❌ Error adding student: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{student_id}")
def update_student(student_id: str, student_data: dict, current_user: dict = Depends(verify_admin)):
    """Update a student - admin only"""
    try:
        doc_ref = db.collection("students").document(student_id)
        doc_ref.update(student_data)
        
        print(f"✅ Updated student {student_id} by admin: {current_user['email']}")
        return {"id": student_id, **student_data}
    except Exception as e:
        print(f"❌ Error updating student {student_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{student_id}")
def delete_student(student_id: str, current_user: dict = Depends(verify_admin)):
    """Delete a student - admin only"""
    try:
        db.collection("students").document(student_id).delete()
        
        print(f"✅ Deleted student {student_id} by admin: {current_user['email']}")
        return {"message": "Student deleted successfully"}
    except Exception as e:
        print(f"❌ Error deleting student {student_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
