#!/usr/bin/env python3
"""
Simple script to create an admin user
"""

import firebase_admin
from firebase_admin import credentials, auth, firestore
import sys

def main():
    # Initialize Firebase Admin SDK
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate("./internal-crm-dashboard-firebase-adminsdk-fbsvc-5922f27c61.json")
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully")
    except Exception as e:
        print(f"❌ Error initializing Firebase: {e}")
        sys.exit(1)

    db = firestore.client()
    
    # Create admin user for your email
    email = "sumedh.sa.jadhav@gmail.com"
    password = "admin123456"
    display_name = "Sumedh Jadhav"
    
    try:
        # Create user in Firebase Auth
        user_record = auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
            email_verified=True
        )
        
        print(f"✅ Created Firebase Auth user: {email}")
        print(f"   UID: {user_record.uid}")
        
        # Create user document in Firestore with admin role
        user_doc_ref = db.collection("users").document(user_record.uid)
        user_doc_ref.set({
            "email": email,
            "name": display_name,
            "role": "admin",
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        print(f"✅ Created Firestore user document with admin role")
        
        print("\n🎉 Admin user created successfully!")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   UID: {user_record.uid}")
        
    except auth.EmailAlreadyExistsError:
        print(f"⚠️  User {email} already exists in Firebase Auth")
        # Update the Firestore document
        try:
            user_record = auth.get_user_by_email(email)
            user_doc_ref = db.collection("users").document(user_record.uid)
            user_doc_ref.set({
                "email": email,
                "name": display_name,
                "role": "admin",
                "created_at": firestore.SERVER_TIMESTAMP
            }, merge=True)
            print(f"✅ Updated Firestore user document with admin role")
        except Exception as e:
            print(f"❌ Error updating user: {e}")
    except Exception as e:
        print(f"❌ Error creating user: {e}")

if __name__ == "__main__":
    main()
