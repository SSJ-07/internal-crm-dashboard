from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from firebase_config import db, auth_client
from auth_dependency import verify_admin

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

@router.get("/user")
def get_current_user(current_user: dict = Depends(verify_admin)):
    """Get current authenticated user info"""
    return UserResponse(
        id=current_user["uid"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"]
    )

@router.post("/verify")
def verify_token(current_user: dict = Depends(verify_admin)):
    """Verify Firebase ID token and return user info"""
    return UserResponse(
        id=current_user["uid"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"]
    )
