# 🚀 Internal CRM Dashboard

A comprehensive internal CRM dashboard built with **Next.js** (frontend) and **FastAPI** (backend) for managing student interactions on undergraduation.com.

## ✨ Features

### 🎯 **Student Directory View**
- ✅ **Table view** of all students with advanced filters and search
- ✅ **Key columns**: Name, Email, Country, Application Status, Last Active
- ✅ **Clickable student profiles** for detailed view
- ✅ **Real-time filtering**: Status, Country, High Intent, Needs Essay Help
- ✅ **Search functionality** across all student fields

### 👤 **Student Individual Profile View**
- ✅ **Basic Info**: Name, email, phone, grade, country
- ✅ **Interaction Timeline**: Login activity, AI questions, document submissions
- ✅ **Communication Log**: Emails, SMS, calls with timestamps
- ✅ **Internal Notes**: Add, edit, delete notes with real-time updates
- ✅ **Progress tracking** based on application stage
- ✅ **Student classification**: High Intent, Needs Essay Help checkboxes

### 📧 **Communication Tools**
- ✅ **Manual communication logging** (calls, emails, SMS)
- ✅ **Email sending** via Resend API (configured for testing)
- ✅ **Follow-up email triggers** with automatic logging
- ✅ **Reminder scheduling** for internal team
- ✅ **Task creation** and management

### 📊 **Insights & Analytics**
- ✅ **Quick filters**: "Not contacted in 7 days", "High intent", "Needs essay help"
- ✅ **Summary statistics**: Total students, status breakdowns, country distribution
- ✅ **Dashboard overview** with key metrics
- ✅ **Real-time data updates** across all views

## 🏗️ Architecture

### **Frontend (Next.js)**
- **Framework**: Next.js 15.5.3 with TypeScript
- **UI Components**: Shadcn/ui with Tailwind CSS
- **Authentication**: Firebase Auth with Google Sign-in
- **State Management**: React hooks and context
- **API Communication**: Custom API client with automatic token handling

### **Backend (FastAPI)**
- **Framework**: FastAPI with Python 3.9+
- **Database**: Firebase Firestore with structured subcollections
- **Authentication**: Firebase ID token verification with admin role checking
- **Email Service**: Resend API integration
- **CORS**: Configured for seamless frontend-backend communication

### **Database Structure**
```
students/{studentId}/
├── Basic info (immutable): name, email, phone, grade, country
└── timeline/{logId}/
    ├── interactions/ (login, AI questions, documents)
    ├── communications/ (emails, SMS, calls)
    ├── notes/ (internal team notes)
    └── tasks/ (assigned tasks)
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.9+
- **Firebase project** with Firestore enabled
- **Resend API key** (for email functionality)

### 1. Clone Repository
```bash
git clone https://github.com/SSJ-07/internal-crm-dashboard.git
cd internal-crm-dashboard
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Firebase service account and Resend API key

# Start backend server
python main.py
```
Backend will run on `http://localhost:8000`

### 3. Frontend Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Firebase web app config

# Start frontend server
npm run dev
```
Frontend will run on `http://localhost:3000`

### 4. Firebase Configuration

#### Service Account (Backend)
1. Download Firebase service account JSON file
2. Place in `backend/` directory as `internal-crm-dashboard-firebase-adminsdk-*.json`
3. Update `.env` with correct file path

#### Web App Config (Frontend)
1. Get Firebase web app configuration from Firebase Console
2. Update `.env.local` with your config:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Admin User Setup
```bash
cd backend
python create_admin_user.py
```
Follow prompts to create your admin user account.

## 🔧 Environment Variables

### Backend (.env)
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_SERVICE_ACCOUNT_PATH=./internal-crm-dashboard-firebase-adminsdk-*.json

# Resend Email API
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_email@domain.com

# JWT Configuration
JWT_SECRET_KEY=your_secret_key
```

### Frontend (.env.local)
```env
# Firebase Web App Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📱 Usage

### 1. **Login**
- Navigate to `http://localhost:3000`
- Click "Sign in with Google"
- Use your admin account credentials

### 2. **Student Management**
- **View all students**: Navigate to "Students" in sidebar
- **Filter students**: Use status, country, and feature filters
- **Search students**: Use the search bar for quick lookup
- **View student profile**: Click on any student name

### 3. **Student Profile Actions**
- **Add interactions**: Log login activity, AI questions, document submissions
- **Send communications**: Email, SMS, or call logging
- **Manage notes**: Add, edit, or delete internal notes
- **Update classification**: Toggle High Intent and Needs Essay Help
- **Create tasks**: Assign tasks to team members
- **Schedule reminders**: Set follow-up reminders

### 4. **Dashboard Overview**
- **View statistics**: Total students, status breakdowns, country distribution
- **Manage reminders**: View upcoming and overdue reminders
- **Quick actions**: Access frequently used features

## 🔒 Security Features

- **Firebase Authentication**: Secure Google Sign-in integration
- **Admin Role Verification**: Backend validates admin permissions
- **JWT Token Management**: Automatic token refresh and validation
- **CORS Protection**: Configured for secure cross-origin requests
- **Input Validation**: Pydantic models ensure data integrity

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/google` - Google Sign-in
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout

### Students
- `GET /api/students/` - List all students
- `GET /api/students/{id}` - Get student details
- `POST /api/students/` - Create new student
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student

### Student Interactions
- `GET /api/students/{id}/interactions` - Get interactions
- `POST /api/students/{id}/interactions` - Add interaction
- `GET /api/students/{id}/communications` - Get communications
- `POST /api/students/{id}/communications` - Add communication
- `GET /api/students/{id}/notes` - Get notes
- `POST /api/students/{id}/notes` - Add note
- `PUT /api/students/{id}/notes/{note_id}` - Update note
- `DELETE /api/students/{id}/notes/{note_id}` - Delete note

### Tasks & Reminders
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/reminders` - List reminders
- `POST /api/reminders` - Create reminder

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

### Frontend Testing
```bash
npm run test
```

### Manual Testing Checklist
- [ ] User can sign in with Google
- [ ] Students page loads with all students
- [ ] Filters work correctly (status, country, features)
- [ ] Student profile page loads with all data
- [ ] Can add/edit/delete notes
- [ ] Can log interactions and communications
- [ ] Can send emails (test mode)
- [ ] Can create and manage tasks
- [ ] Dashboard shows correct statistics
- [ ] All data persists after page refresh

## 🚀 Deployment

### Backend (FastAPI)
```bash
# Using Uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000

# Using Gunicorn (production)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend (Next.js)
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📊 Performance

- **Backend**: FastAPI with async/await for high performance
- **Database**: Firestore with optimized queries and caching
- **Frontend**: Next.js with server-side rendering and static generation
- **Real-time Updates**: Efficient polling with cache-busting
- **Caching**: Browser caching with proper cache headers

## 🔧 Troubleshooting

### Common Issues

1. **"Failed to fetch" errors**
   - Ensure backend is running on port 8000
   - Check CORS configuration
   - Verify API endpoints are accessible

2. **Authentication issues**
   - Verify Firebase configuration
   - Check admin user exists in Firestore
   - Ensure service account file is correct

3. **Database connection issues**
   - Verify Firebase project ID
   - Check service account permissions
   - Ensure Firestore is enabled

4. **Email not sending**
   - Verify Resend API key
   - Check from email is verified
   - Review email logs in backend

## 📝 Development

### Project Structure
```
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── app/
│   │   ├── models/            # Pydantic models
│   │   └── services/          # Business logic
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
├── src/
│   ├── app/                   # Next.js pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities and API client
│   └── .env.local            # Frontend environment
└── README.md                  # This file
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Roadmap

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Bulk operations (import/export)
- [ ] Mobile responsive design
- [ ] API rate limiting
- [ ] Automated testing pipeline
- [ ] Docker containerization
- [ ] CI/CD pipeline

## 🤝 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the troubleshooting section

---

**Built with ❤️ for the undergraduation.com team**