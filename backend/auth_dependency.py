from fastapi import HTTPException, Request, Depends
from firebase_admin import auth as firebase_auth
from firebase_admin import firestore
from firebase_config import db, auth_client

def verify_admin(request: Request):
    """Dependency to verify admin before handling any route."""
    # Expect frontend to send Firebase ID token in Authorization header
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    
    try:
        # Remove "Bearer " prefix if present
        if token.startswith("Bearer "):
            token = token[7:]
        
        # Verify Firebase ID token
        decoded = auth_client.verify_id_token(token)
        uid = decoded["uid"]
        
        # Check if user exists in Firestore and has admin role
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=403, detail="User not found in system")
        
        user_data = user_doc.to_dict()
        if user_data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not an admin")
        
        return {
            "uid": uid,
            "email": decoded.get("email"),
            "name": decoded.get("name", user_data.get("name", "")),
            "role": user_data.get("role")
        }
        
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"❌ Auth verification error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
