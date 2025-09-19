"""
Configuration settings for the FastAPI application
"""

from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "Internal CRM Dashboard API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # CORS settings
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Database settings
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/crm_dashboard"
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    
    # Authentication settings
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Email settings
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "onboarding@resend.dev"
    
    # Redis settings (for caching)
    REDIS_URL: str = "redis://localhost:6379"
    
    # AI settings
    GOOGLE_AI_API_KEY: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()
