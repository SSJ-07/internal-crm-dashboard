"""
Authentication endpoints
"""

from fastapi import APIRouter, HTTPException, status
from app.core.auth import create_access_token, verify_password, get_password_hash
from app.core.config import settings
from datetime import timedelta

router = APIRouter()

@router.post("/login")
async def login():
    """
    Login endpoint - for now, returns a simple token
    In production, integrate with Firebase Auth or your preferred auth provider
    """
    # For now, we'll return a simple token
    # In production, verify credentials and create proper JWT
    access_token = create_access_token(
        data={"sub": "user123", "email": "user@example.com"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/verify")
async def verify_token():
    """
    Verify token endpoint
    """
    return {"valid": True, "message": "Token is valid"}

@router.post("/logout")
async def logout():
    """
    Logout endpoint
    """
    return {"message": "Successfully logged out"}
