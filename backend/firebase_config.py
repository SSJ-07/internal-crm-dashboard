import firebase_admin
from firebase_admin import credentials, firestore, auth
import os

# Load from env
SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT", "./internal-crm-dashboard-firebase-adminsdk-fbsvc-5922f27c61.json")

try:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)
    print(f"✅ Firebase initialized successfully with service account")
except Exception as e:
    print(f"❌ Error initializing Firebase: {e}")

db = firestore.client()
auth_client = auth  # alias

print(f"Using service account: {SERVICE_ACCOUNT_PATH}")
