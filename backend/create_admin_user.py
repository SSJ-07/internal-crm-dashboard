#!/usr/bin/env python3
"""
Script to create an admin user in Firebase Auth and Firestore
Run this script to add your email as an admin user
"""

import firebase_admin
from firebase_admin import credentials, auth, firestore
import sys

# Initialize Firebase Admin SDK
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate("./internal-crm-dashboard-firebase-adminsdk-fbsvc-5922f27c61.json")
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized successfully")
    else:
        print("✅ Firebase already initialized")
except Exception as e:
    print(f"❌ Error initializing Firebase: {e}")
    sys.exit(1)

db = firestore.client()

def create_admin_user(email: str, password: str, display_name: str = None):
    """Create an admin user in Firebase Auth and Firestore"""
    try:
        # Create user in Firebase Auth
        user_record = auth.create_user(
            email=email,
            password=password,
            display_name=display_name or email.split('@')[0],
            email_verified=True
        )
        
        print(f"✅ Created Firebase Auth user: {email}")
        print(f"   UID: {user_record.uid}")
        
        # Create user document in Firestore with admin role
        user_doc_ref = db.collection("users").document(user_record.uid)
        user_doc_ref.set({
            "email": email,
            "name": display_name or email.split('@')[0],
            "role": "admin",
            "created_at": firestore.SERVER_TIMESTAMP,
            "last_login": firestore.SERVER_TIMESTAMP
        })
        
        print(f"✅ Created Firestore user document with admin role")
        print(f"   Collection: users/{user_record.uid}")
        print(f"   Role: admin")
        
        return user_record.uid
        
    except auth.EmailAlreadyExistsError:
        print(f"⚠️  User {email} already exists in Firebase Auth")
        # Still create/update the Firestore document
        try:
            # Get existing user
            user_record = auth.get_user_by_email(email)
            print(f"   Found existing UID: {user_record.uid}")
            
            # Update Firestore document
            user_doc_ref = db.collection("users").document(user_record.uid)
            user_doc_ref.set({
                "email": email,
                "name": display_name or email.split('@')[0],
                "role": "admin",
                "created_at": firestore.SERVER_TIMESTAMP,
                "last_login": firestore.SERVER_TIMESTAMP
            }, merge=True)
            
            print(f"✅ Updated Firestore user document with admin role")
            return user_record.uid
            
        except Exception as e:
            print(f"❌ Error updating existing user: {e}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return None

if __name__ == "__main__":
    print("🔐 Creating Admin User for CRM Dashboard")
    print("=" * 50)
    
    # Get user input
    email = input("Enter admin email: ").strip()
    if not email:
        print("❌ Email is required")
        sys.exit(1)
    
    password = input("Enter admin password (min 6 characters): ").strip()
    if len(password) < 6:
        print("❌ Password must be at least 6 characters")
        sys.exit(1)
    
    display_name = input("Enter display name (optional): ").strip()
    if not display_name:
        display_name = email.split('@')[0]
    
    print(f"\n📝 Creating admin user:")
    print(f"   Email: {email}")
    print(f"   Display Name: {display_name}")
    print(f"   Role: admin")
    print()
    
    uid = create_admin_user(email, password, display_name)
    
    if uid:
        print("\n🎉 Admin user created successfully!")
        print(f"   You can now log in with email: {email}")
        print(f"   Password: {password}")
        print(f"   UID: {uid}")
        print("\n🚀 Next steps:")
        print("   1. Start the backend: cd backend && python main.py")
        print("   2. Start the frontend: npm run dev")
        print("   3. Go to http://localhost:3000/login")
        print("   4. Sign in with Google or email/password")
    else:
        print("\n❌ Failed to create admin user")
        sys.exit(1)
