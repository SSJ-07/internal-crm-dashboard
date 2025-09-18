# Internal CRM Dashboard - FastAPI + Next.js Setup Guide

This guide will help you set up the complete application with FastAPI backend and Next.js frontend.

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP/HTTPS     ┌─────────────────┐
│   Next.js       │ ────────────────► │   FastAPI       │
│   Frontend      │                   │   Backend       │
│                 │ ◄──────────────── │                 │
└─────────────────┘                   └─────────────────┘
                                              │
                                              ▼
                                       ┌─────────────────┐
                                       │   Firestore     │
                                       │   Database      │
                                       └─────────────────┘
```

## 📋 Prerequisites

- **Python 3.13** (latest version)
- **Node.js 18+** and npm
- **Firebase Project** with Firestore enabled
- **Resend API Key** for email functionality

## 🚀 Quick Start

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Run the setup script
./run.sh
```

If the script doesn't work, follow these manual steps:

```bash
# Create virtual environment
python3.13 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp env.example .env
# Edit .env with your actual values

# Start the server
python start.py
```

The FastAPI backend will be available at `http://localhost:8000`

### 2. Frontend Setup (Next.js)

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Configure environment
cp env.local.example .env.local
# Edit .env.local with your actual values

# Start the development server
npm run dev
```

The Next.js frontend will be available at `http://localhost:3000`

## ⚙️ Configuration

### Backend Configuration (`.env`)

```env
# App Settings
DEBUG=false
APP_NAME="Internal CRM Dashboard API"
VERSION="1.0.0"

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Firebase Settings
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Authentication
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Settings
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=onboarding@resend.dev

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Frontend Configuration (`.env.local`)

```env
# FastAPI Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Firebase Configuration (for authentication only)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 🔧 Firebase Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database

2. **Generate Service Account Key**:
   - Go to Project Settings > Service Accounts
   - Generate a new private key
   - Download the JSON file
   - Extract the values for your `.env` file

3. **Configure Firestore Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 📧 Email Setup (Resend)

1. **Sign up for Resend**:
   - Go to [Resend](https://resend.com/)
   - Create an account
   - Get your API key

2. **Configure Domain**:
   - Add your domain in Resend dashboard
   - Update `EMAIL_FROM` in your `.env` file

## 🗂️ Project Structure

```
internal-crm-dashboard/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Pydantic models
│   │   └── services/       # Business logic
│   ├── main.py             # FastAPI app
│   ├── start.py            # Startup script
│   ├── requirements.txt    # Python dependencies
│   └── run.sh              # Setup script
├── src/                    # Next.js Frontend
│   ├── app/                # App Router pages
│   ├── components/         # React components
│   └── lib/                # Utilities and API client
├── package.json            # Node.js dependencies
└── SETUP.md               # This file
```

## 🚀 Running the Application

### Development Mode

1. **Start Backend**:
   ```bash
   cd backend
   ./run.sh
   ```

2. **Start Frontend** (in new terminal):
   ```bash
   npm run dev
   ```

3. **Access the Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Production Mode

1. **Build Frontend**:
   ```bash
   npm run build
   npm start
   ```

2. **Run Backend with Gunicorn**:
   ```bash
   cd backend
   source venv/bin/activate
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

## 🔍 API Documentation

Once the backend is running, you can access:

- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## 🧪 Testing the Setup

1. **Test Backend**:
   ```bash
   curl http://localhost:8000/health
   ```

2. **Test Frontend**:
   - Open http://localhost:3000
   - Try logging in and managing students

3. **Test API Integration**:
   - Check browser network tab for API calls
   - Verify data flows from frontend to backend to Firestore

## 🐛 Troubleshooting

### Common Issues

1. **Python 3.13 not found**:
   - Install Python 3.13 from python.org
   - Or use pyenv: `pyenv install 3.13.0`

2. **Firebase connection issues**:
   - Verify your service account key
   - Check Firestore rules
   - Ensure project ID is correct

3. **CORS errors**:
   - Add your frontend URL to `ALLOWED_ORIGINS` in backend `.env`

4. **Email not sending**:
   - Verify Resend API key
   - Check domain configuration in Resend

### Logs

- **Backend logs**: Check terminal where you ran `python start.py`
- **Frontend logs**: Check browser console and terminal where you ran `npm run dev`

## 📚 Next Steps

1. **Customize the UI**: Modify components in `src/components/`
2. **Add new features**: Create new API endpoints in `backend/app/api/`
3. **Deploy**: Use services like Vercel (frontend) and Railway/Heroku (backend)
4. **Monitor**: Set up logging and monitoring for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
