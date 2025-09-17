# Firebase Firestore Security Rules Setup

## The Error
You're getting a "permission-denied" error because your Firestore database doesn't have proper security rules set up.

## How to Fix

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Firestore Database" in the left sidebar
4. Click on "Rules" tab

### Step 2: Replace the Rules
Copy and paste this code into the rules editor:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write to students collection
    match /students/{document} {
      allow read, write: if request.auth != null;
      
      // Allow reading and writing notes subcollection
      match /notes/{noteId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Allow authenticated users to read and write to tasks collection
    match /tasks/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read and write to reminders collection
    // Only allow users to access their own reminders
    match /reminders/{document} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.createdBy == request.auth.token.email);
    }
  }
}
```

### Step 3: Publish the Rules
1. Click "Publish" button
2. Wait for the rules to be deployed

### Step 4: Re-enable Reminders
After setting up the rules, uncomment the reminder code in:
- `src/app/layout-client.tsx` (lines 47-68)
- `src/app/page.tsx` (lines 28-51)

## What These Rules Do
- **Students & Tasks**: Any authenticated user can read/write
- **Reminders**: Users can only access reminders they created (based on `createdBy` field)
- **Notes**: Any authenticated user can read/write student notes

## Security Note
These rules are permissive for development. For production, you might want to add more specific restrictions based on your needs.
