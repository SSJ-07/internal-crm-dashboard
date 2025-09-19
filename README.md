# 🚀 Internal CRM Dashboard

A comprehensive internal CRM dashboard built with **Next.js** (frontend) and **FastAPI** (backend) for managing student interactions on undergraduation.com.

## ✨ Features

### 🎯 **Student Directory View**
- ✅ **Table view** of all students with advanced filters and search
- ✅ **Key columns**: Name, Email, Country, Application Status, Last Active
- ✅ **Clickable student profiles** for detailed view
- ✅ **Real-time filtering**: Status, Country, High Intent, Needs Essay Help
- ✅ **Search functionality** across all student fields
- ✅ **Bulk operations**: Import/export student data
- ✅ **Advanced sorting**: By name, status, last active, country

### 👤 **Student Individual Profile View**
- ✅ **Basic Info**: Name, email, phone, grade, country
- ✅ **Interaction Timeline**: Login activity, AI questions, document submissions
- ✅ **Communication Log**: Emails, SMS, calls with timestamps
- ✅ **Internal Notes**: Add, edit, delete notes with real-time updates
- ✅ **Progress tracking** based on application stage
- ✅ **Student classification**: High Intent, Needs Essay Help checkboxes
- ✅ **Real-time activity updates** and last active tracking

### 📧 **Communication Management**
- ✅ **Dedicated Communications Page**: View all communications across all students
- ✅ **Advanced filtering**: By type (email, call, SMS), direction, status, student
- ✅ **Search functionality**: Find communications by content, subject, or student
- ✅ **Communication logging**: Manual logging of calls, emails, SMS
- ✅ **Email sending** via Resend API with automatic logging
- ✅ **Follow-up tracking**: Automatic reminder creation for communications

### 📋 **Task Management System**
- ✅ **Comprehensive Task Dashboard**: View all tasks across all students
- ✅ **Task creation**: Assign tasks to specific students or general tasks
- ✅ **Status management**: Pending, In Progress, Finished, Deleted
- ✅ **Priority levels**: High, Medium, Low priority classification
- ✅ **Due date tracking**: Visual indicators for overdue and upcoming tasks
- ✅ **Student assignment**: Link tasks to specific students
- ✅ **Task filtering**: By status, priority, student, due date
- ✅ **Soft delete**: Move tasks to deleted tab instead of permanent deletion
- ✅ **Task restoration**: Restore deleted tasks when needed

### 📊 **Advanced Analytics Dashboard**
- ✅ **Key Metrics Cards**: Total students, communications, interactions, applications
- ✅ **Percentage Changes**: Month-over-month growth indicators
- ✅ **Visual Icons**: Professional SVG icons for each metric
- ✅ **Real-time Statistics**: Live data updates from Firestore
- ✅ **Performance Metrics**: Application progress tracking
- ✅ **Communication Analytics**: Total communications and recent activity
- ✅ **Interaction Tracking**: Student engagement metrics

### 🔔 **Smart Notification System**
- ✅ **Notification Bell**: Centralized notification center
- ✅ **Reminder Management**: Overdue and upcoming reminders
- ✅ **Visual Indicators**: Color-coded priority system
- ✅ **Mini Reminder View**: Quick access to important tasks
- ✅ **Real-time Updates**: Live notification updates

### ⚙️ **Settings & Configuration**
- ✅ **Profile Management**: Update user information and preferences
- ✅ **Notification Settings**: Customize email, push, and reminder notifications
- ✅ **Display Preferences**: Theme, language, date format, pagination
- ✅ **Security Settings**: Password change, two-factor authentication
- ✅ **Data Management**: Export data, account deletion options
- ✅ **Role Management**: Administrator, Manager, Counselor, Viewer roles

## 🏗️ Architecture

### **Frontend (Next.js)**
- **Framework**: Next.js 15.5.3 with TypeScript
- **UI Components**: Shadcn/ui with Tailwind CSS
- **Authentication**: Firebase Auth with Google Sign-in
- **State Management**: React hooks and context
- **API Communication**: Custom API client with automatic token handling
- **Performance**: Optimized with Collection Group Queries and batch operations
- **Design System**: Consistent blue/white/black aesthetic with professional icons

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
- **Bulk operations**: Import/export student data

### 3. **Student Profile Actions**
- **Add interactions**: Log login activity, AI questions, document submissions
- **Send communications**: Email, SMS, or call logging
- **Manage notes**: Add, edit, or delete internal notes
- **Update classification**: Toggle High Intent and Needs Essay Help
- **Create tasks**: Assign tasks to team members
- **Schedule reminders**: Set follow-up reminders

### 4. **Communication Management**
- **Global communications view**: Navigate to "Communications" in sidebar
- **Filter communications**: By type, direction, status, or student
- **Search communications**: Find specific communications by content
- **Log new communications**: Add emails, calls, or SMS records
- **Track communication history**: View all interactions with students

### 5. **Task Management**
- **Task dashboard**: Navigate to "Tasks" in sidebar
- **Create tasks**: Assign to specific students or general tasks
- **Manage task status**: Update from Pending to In Progress to Finished
- **Set priorities**: Mark tasks as High, Medium, or Low priority
- **Due date tracking**: Visual indicators for overdue tasks
- **Task filtering**: Filter by status, priority, student, or due date
- **Soft delete**: Move completed tasks to deleted tab
- **Restore tasks**: Restore accidentally deleted tasks

### 6. **Analytics Dashboard**
- **Key metrics**: View total students, communications, interactions
- **Growth indicators**: See percentage changes from previous month
- **Performance tracking**: Monitor application progress and engagement
- **Real-time updates**: Live data refresh from Firestore
- **Visual analytics**: Professional charts and metrics display

### 7. **Notification Center**
- **Notification bell**: Click the bell icon in the top navigation
- **Reminder management**: View overdue and upcoming reminders
- **Priority indicators**: Color-coded reminder system
- **Quick actions**: Access important tasks and communications

### 8. **Settings & Configuration**
- **Profile settings**: Update your personal information and role
- **Notification preferences**: Customize email and push notifications
- **Display options**: Choose theme, language, and date format
- **Security settings**: Manage password and two-factor authentication
- **Data management**: Export your data or manage account settings

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
- `PUT /api/students/{id}/last-active` - Update last active timestamp

### Student Interactions
- `GET /api/students/{id}/interactions` - Get student interactions
- `POST /api/students/{id}/interactions` - Add interaction
- `GET /api/students/{id}/communications` - Get student communications
- `POST /api/students/{id}/communications` - Add communication
- `GET /api/students/{id}/notes` - Get student notes
- `POST /api/students/{id}/notes` - Add note
- `PUT /api/students/{id}/notes/{note_id}` - Update note
- `DELETE /api/students/{id}/notes/{note_id}` - Delete note

### Global Data Access
- `GET /api/communications` - Get all communications across all students
- `GET /api/interactions` - Get all interactions across all students

### Tasks & Reminders
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/reminders` - List reminders
- `POST /api/reminders` - Create reminder

### Dashboard & Analytics
- `GET /api/dashboard/stats` - Get comprehensive dashboard statistics
- `GET /test` - Health check endpoint

### Email Services
- `POST /api/email/send` - Send email via Resend API

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
- [ ] Communications page loads with all communications
- [ ] Communication filtering works (type, direction, status)
- [ ] Task management system functions properly
- [ ] Task status updates work correctly
- [ ] Task filtering and sorting work
- [ ] Soft delete and restore functionality works
- [ ] Analytics dashboard displays correct metrics
- [ ] Percentage changes show accurate data
- [ ] Notification bell displays reminders
- [ ] Settings page loads and functions properly
- [ ] Profile management works correctly
- [ ] Notification preferences can be updated
- [ ] Display preferences can be changed
- [ ] Security settings are accessible

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
- **Database**: Firestore with optimized Collection Group Queries and batch operations
- **Frontend**: Next.js with server-side rendering and static generation
- **Real-time Updates**: Efficient polling with cache-busting
- **Caching**: Browser caching with proper cache headers
- **Query Optimization**: Reduced N+1 query problems with batch data fetching
- **Data Loading**: Optimized API calls with placeholder data for demonstration

## 🚀 Key Technical Achievements

### **Database Optimization**
- **Collection Group Queries**: Efficient cross-student data retrieval
- **Batch Operations**: Reduced database reads with bulk data fetching
- **Optimized Indexing**: Strategic Firestore index usage for better performance

### **User Experience Enhancements**
- **Real-time Updates**: Live data refresh across all modules
- **Professional UI**: Consistent design system with modern components
- **Intuitive Navigation**: Streamlined user flow with clear information architecture
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

### **System Architecture**
- **Modular Design**: Clean separation of concerns between frontend and backend
- **Scalable API**: RESTful endpoints designed for future expansion
- **Error Handling**: Comprehensive error management and user feedback
- **Security**: Multi-layer security with Firebase Auth and role-based access

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

### ✅ **Completed Features**
- [x] Advanced analytics dashboard with metrics and percentage changes
- [x] Comprehensive task management system
- [x] Global communications view and management
- [x] Smart notification system with reminder management
- [x] Settings and configuration management
- [x] Real-time data updates and live statistics
- [x] Professional UI with consistent design system

### 🚧 **In Progress**
- [ ] Mobile responsive design optimization
- [ ] Advanced bulk operations (import/export)
- [ ] Enhanced search functionality across all modules

### 📋 **Planned Features**
- [ ] Real-time push notifications
- [ ] Advanced reporting and data visualization
- [ ] API rate limiting and performance optimization
- [ ] Automated testing pipeline
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Advanced user role management
- [ ] Data backup and recovery system
- [ ] Integration with external CRM systems
- [ ] Advanced analytics and business intelligence

## 🤝 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the troubleshooting section

---

**Built with ❤️ for the undergraduation.com team**