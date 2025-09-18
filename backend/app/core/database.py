"""
Database configuration and connection management
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import firebase_admin
from firebase_admin import credentials, firestore
import redis

# SQLAlchemy setup
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Firebase setup
firebase_app = None
db = None

# Redis setup
redis_client = None

async def init_db():
    """Initialize database connections"""
    global firebase_app, db, redis_client
    
    # Initialize Firebase
    if not firebase_app:
        if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_PRIVATE_KEY:
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "token_uri": "https://oauth2.googleapis.com/token"
            })
            firebase_app = firebase_admin.initialize_app(cred)
            db = firestore.client()
    
    # Initialize Redis
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        redis_client.ping()  # Test connection
    except Exception as e:
        print(f"Redis connection failed: {e}")
        redis_client = None

def get_db():
    """Get database session"""
    db_session = SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

def get_firestore():
    """Get Firestore client"""
    return db

def get_redis():
    """Get Redis client"""
    return redis_client
